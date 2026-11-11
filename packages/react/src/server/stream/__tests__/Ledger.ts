import { getLedger } from '../Ledger';
import { serialize } from '../serialize';
import { STREAM_GLOBAL } from '../wire';
import type { PieceMessage, StreamMessage } from '../wire';

const push = (...messages: StreamMessage[]) =>
  ((globalThis as any)[STREAM_GLOBAL] ??= []).push(...messages);

const btc = (price: number, fetchedAt: number): PieceMessage => ({
  t: 'piece',
  rev: 0,
  entities: { Ticker: { BTC: { id: 'BTC', price } } },
  entitiesMeta: {
    Ticker: {
      BTC: { fetchedAt, date: fetchedAt, expiresAt: fetchedAt + 1000 },
    },
  },
  endpoints: { 'GET /btc': 'BTC' },
  meta: {
    'GET /btc': { fetchedAt, date: fetchedAt, expiresAt: fetchedAt + 1000 },
  },
});

describe('getLedger', () => {
  let now: jest.SpiedFunction<typeof Date.now>;
  beforeEach(() => {
    delete (globalThis as any)[STREAM_GLOBAL];
    now = jest.spyOn(Date, 'now').mockReturnValue(50_000);
  });
  afterEach(() => {
    now.mockRestore();
    delete (globalThis as any)[STREAM_GLOBAL];
  });

  it('is one ledger per document and replays messages pushed before it', () => {
    push(
      { t: 'open', v: 1, rev: 1, at: 50_000 },
      { ...btc(100, 49_000), rev: 1 },
    );
    const ledger = getLedger()!;
    expect(getLedger()).toBe(ledger);
    expect(ledger.shellRev).toBe(1);
    expect(ledger.rev).toBe(1);
    expect(ledger.stats()).toEqual({ pieces: 1, pins: 0, unknown: 0 });
    // the queue keeps nothing the ledger already holds
    expect((globalThis as any)[STREAM_GLOBAL]).toHaveLength(0);
    push({ ...btc(101, 49_500), rev: 2 });
    expect(ledger.rev).toBe(2);
    expect(ledger.after(1).map(p => p.rev)).toEqual([2]);
  });

  it('shifts meta times once by the clock difference at open', () => {
    const ledger = getLedger()!;
    // server clock is 10s behind the client
    push({ t: 'open', v: 1, rev: 0, at: 40_000 });
    expect(ledger.openedAt).toBe(50_000);
    now.mockReturnValue(60_000);
    push({ ...btc(100, 40_500), rev: 1 });
    const [piece] = ledger.after(0);
    expect(piece.entitiesMeta!.Ticker.BTC).toEqual({
      fetchedAt: 50_500,
      date: 50_500,
      expiresAt: 51_500,
    });
    expect(piece.meta!['GET /btc']!.expiresAt).toBe(51_500);
  });

  it('stores an expiry that crossed the wire as null as never expiring, unshifted', () => {
    const ledger = getLedger()!;
    const never = { fetchedAt: 40_500, date: 40_500, expiresAt: Infinity };
    // the script the server writes, run as the parser would
    new Function(
      serialize([
        { t: 'open', v: 1, rev: 0, at: 40_000 },
        {
          t: 'piece',
          rev: 1,
          entities: { Ticker: { BTC: { id: 'BTC' } } },
          entitiesMeta: { Ticker: { BTC: never } },
          endpoints: { 'GET /btc': 'BTC' },
          meta: { 'GET /btc': { ...never, prevExpiresAt: Infinity } },
        },
      ]),
    )();
    const [piece] = ledger.after(0);
    expect(piece.entitiesMeta!.Ticker.BTC).toEqual({
      fetchedAt: 50_500,
      date: 50_500,
      expiresAt: Infinity,
    });
    expect(piece.meta!['GET /btc']).toEqual({
      fetchedAt: 50_500,
      date: 50_500,
      expiresAt: Infinity,
      prevExpiresAt: Infinity,
    });
    expect(ledger.fold(1).meta['GET /btc'].expiresAt).toBe(Infinity);
  });

  it('records every entity object of a piece as placed, and the seed is built from them', () => {
    const ledger = getLedger()!;
    const piece = { ...btc(100, 49_000), rev: 1 };
    const object = piece.entities!.Ticker.BTC as object;
    push({ t: 'open', v: 1, rev: 1, at: 50_000 }, piece, {
      t: 'piece',
      rev: 2,
      entities: { Ticker: { ETH: 0, SOL: null } },
    });
    expect(ledger.placed.has(object)).toBe(true);
    const seed = ledger.fold(1);
    expect(seed.entities.Ticker!.BTC).toBe(object);
    expect(ledger.placed.has(seed.entities.Ticker!.BTC as object)).toBe(true);
  });

  it('folds into fresh tables every call; snapshot reports entries unexpired', () => {
    const ledger = getLedger()!;
    push(
      { t: 'open', v: 1, rev: 2, at: 50_000 },
      { ...btc(100, 49_000), rev: 1 },
      { ...btc(101, 49_500), rev: 2 },
    );
    const a = ledger.fold(1);
    const b = ledger.fold(1);
    expect(a).toEqual(b);
    expect(a.entities).not.toBe(b.entities);
    expect(a.entities.Ticker).not.toBe(b.entities.Ticker);
    expect(a.entitiesMeta.Ticker).not.toBe(b.entitiesMeta.Ticker);
    expect(a.meta).not.toBe(b.meta);
    expect((a.entities.Ticker!.BTC as any).price).toBe(100);
    expect((ledger.fold(2).entities.Ticker!.BTC as any).price).toBe(101);
    const snap = ledger.snapshot(2);
    expect(snap.meta['GET /btc'].expiresAt).toBe(Infinity);
    expect(snap.entitiesMeta.Ticker.BTC.expiresAt).toBe(Infinity);
    expect(ledger.fold(2).meta['GET /btc'].expiresAt).toBe(50_500);
  });

  it('whenOpen is one promise, settled for use() when open or end arrives', async () => {
    const ledger = getLedger()!;
    const open = ledger.whenOpen();
    expect(ledger.whenOpen()).toBe(open);
    expect((open as any).status).toBeUndefined();
    push({ t: 'open', v: 1, rev: 0, at: 50_000 });
    expect((open as any).status).toBe('fulfilled');
    await open;

    delete (globalThis as any)[STREAM_GLOBAL];
    const other = getLedger()!;
    expect(other).not.toBe(ledger);
    push({ t: 'end' });
    expect((other.whenOpen() as any).status).toBe('fulfilled');
    expect(other.shellRev).toBeUndefined();
    expect(other.ended).toBe(true);
  });

  it('whenPin is one promise per id, resolves with the pin, or null at end', async () => {
    const ledger = getLedger()!;
    push({ t: 'open', v: 1, rev: 0, at: 50_000 });
    const a = ledger.whenPin('a');
    expect(ledger.whenPin('a')).toBe(a);
    push({ t: 'pin', id: 'a', rev: 3 });
    expect(ledger.pin('a')).toBe(3);
    expect(a).toMatchObject({ status: 'fulfilled', value: 3 });
    await expect(a).resolves.toBe(3);
    // a pin already in the ledger gives a settled promise
    push({ t: 'pin', id: 'c', rev: 1 });
    expect(ledger.whenPin('c')).toMatchObject({
      status: 'fulfilled',
      value: 1,
    });
    // a moved pin replaces the old one
    push({ t: 'pin', id: 'c', rev: 2 });
    expect(ledger.pin('c')).toBe(2);

    const b = ledger.whenPin('b');
    push({ t: 'end' });
    await expect(b).resolves.toBeNull();
    expect(ledger.whenPin('z')).toMatchObject({
      status: 'fulfilled',
      value: null,
    });
  });

  it('settles a promise use() marked pending', async () => {
    const ledger = getLedger()!;
    // what `use()` does to a promise without a status before it suspends
    const open: any = ledger.whenOpen();
    open.status = 'pending';
    const pin: any = ledger.whenPin('a');
    pin.status = 'pending';
    const late: any = ledger.whenPin('b');
    late.status = 'pending';
    push(
      { t: 'open', v: 1, rev: 0, at: 50_000 },
      { t: 'pin', id: 'a', rev: 2 },
    );
    await expect(open).resolves.toBeUndefined();
    expect(open.status).toBe('fulfilled');
    await expect(pin).resolves.toBe(2);
    expect(pin).toMatchObject({ status: 'fulfilled', value: 2 });
    push({ t: 'end' });
    await expect(late).resolves.toBeNull();
  });

  it('drops the pin at commit and any pin that arrives later for that id', () => {
    const ledger = getLedger()!;
    push(
      { t: 'open', v: 1, rev: 0, at: 50_000 },
      { t: 'pin', id: 'a', rev: 1 },
    );
    expect(ledger.stats().pins).toBe(1);
    ledger.commit('a');
    ledger.commit('a');
    expect(ledger.pin('a')).toBeUndefined();
    expect(ledger.stats().pins).toBe(0);
    push({ t: 'pin', id: 'a', rev: 2 });
    expect(ledger.pin('a')).toBeUndefined();
    expect(ledger.stats().pins).toBe(0);
    ledger.commit('never-pinned');
    push({ t: 'pin', id: 'never-pinned', rev: 2 });
    expect(ledger.stats().pins).toBe(0);
  });

  it('drops the pieces once the stream ended, no pin is left and every piece was handed out', () => {
    const ledger = getLedger()!;
    push(
      { t: 'open', v: 1, rev: 1, at: 50_000 },
      { ...btc(100, 49_000), rev: 1 },
      { ...btc(101, 49_500), rev: 2 },
      { t: 'pin', id: 'a', rev: 2 },
      { t: 'end' },
    );
    expect(ledger.stats()).toEqual({ pieces: 2, pins: 1, unknown: 0 });
    ledger.after(1);
    expect(ledger.stats().pieces).toBe(2);
    ledger.commit('a');
    expect(ledger.stats()).toEqual({ pieces: 0, pins: 0, unknown: 0 });
  });

  it('keeps the pieces until the publisher took them', () => {
    const ledger = getLedger()!;
    push(
      { t: 'open', v: 1, rev: 1, at: 50_000 },
      { ...btc(100, 49_000), rev: 1 },
      { ...btc(101, 49_500), rev: 2 },
      { t: 'end' },
    );
    expect(ledger.stats().pieces).toBe(2);
    expect((ledger.fold(1).entities.Ticker!.BTC as any).price).toBe(100);
    expect(ledger.after(1)).toHaveLength(1);
    expect(ledger.stats().pieces).toBe(0);
  });

  it('skips unsafe keys', () => {
    const ledger = getLedger()!;
    const piece = JSON.parse(
      '{"t":"piece","rev":1,"entities":{"__proto__":{"x":{"a":1}},"Ticker":{"constructor":{"a":1},"BTC":{"id":"BTC"}}},"endpoints":{"prototype":1,"ok":2}}',
    );
    push({ t: 'open', v: 1, rev: 1, at: 50_000 }, piece, {
      t: 'pin',
      id: '__proto__',
      rev: 1,
    });
    const state = ledger.fold(1);
    expect(Object.keys(state.entities)).toEqual(['Ticker']);
    expect(Object.keys(state.entities.Ticker!)).toEqual(['BTC']);
    expect(state.endpoints).toEqual({ ok: 2 });
    expect(({} as any).a).toBeUndefined();
    expect(ledger.stats().pins).toBe(0);
  });

  it('ends the stream on an unknown wire version', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ledger = getLedger()!;
    push(
      { t: 'open', v: 2 as any, rev: 1, at: 50_000 },
      { ...btc(100, 1), rev: 1 },
    );
    expect(ledger.ended).toBe(true);
    expect(ledger.shellRev).toBeUndefined();
    expect(ledger.stats().pieces).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('calls listeners once per script, after its messages are in', () => {
    const ledger = getLedger()!;
    const seen: number[] = [];
    const unsubscribe = ledger.subscribe(() => seen.push(ledger.rev));
    push(
      { t: 'open', v: 1, rev: 0, at: 50_000 },
      { ...btc(1, 1), rev: 1 },
      { ...btc(2, 1), rev: 2 },
    );
    push({ ...btc(3, 1), rev: 3 });
    unsubscribe();
    push({ ...btc(4, 1), rev: 4 });
    expect(seen).toEqual([2, 3]);
  });

  it('records announcements', () => {
    const ledger = getLedger()!;
    push({ t: 'ann', keys: ['GET /a', 'GET /b'] });
    expect(ledger.announced('GET /a')).toBe(true);
    expect(ledger.announced('GET /c')).toBe(false);
  });
});
