import {
  Controller,
  actions,
  createReducer,
  initialState,
  __INTERNAL__,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Collection, Endpoint, Entity, schema } from '@data-client/endpoint';
import { resource } from '@data-client/rest';

import { APPLY, applyPiece, foldPieces } from '../applyPiece';
import type { ClassMap } from '../applyPiece';
import { diffState } from '../diffState';
import StreamManager from '../StreamManager';
import type { PieceMessage } from '../wire';

const INVALID = __INTERNAL__.INVALID;
const OPENED = 10_000;

class Ticker extends Entity {
  id = '';
  price = 0;
  volume = 0;
  direction = '';
  static key = 'Ticker';
  static indexes = ['symbol'] as const;
  symbol = '';
  static merge(existing: any, incoming: any) {
    return {
      ...existing,
      ...incoming,
      direction:
        incoming.price === undefined || existing.price === undefined ? ''
        : incoming.price > existing.price ? 'up'
        : 'down',
    };
  }
}
class Book extends Entity {
  id = '';
  lastUpdateId = 0;
  static key = 'Book';
  static shouldUpdate(_em: any, _im: any, existing: any, incoming: any) {
    return incoming.lastUpdateId > existing.lastUpdateId;
  }
}
class Other extends Entity {
  id = '';
  value = 0;
  static key = 'Other';
}
const getTicker = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id } as any),
  { schema: Ticker, name: 'getTicker' },
);
const getBook = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id } as any),
  { schema: Book, name: 'getBook' },
);
const getOther = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id } as any),
  { schema: Other, name: 'getOther' },
);

const reducer = createReducer(new Controller());
function setResponse(
  state: State<unknown>,
  endpoint: any,
  args: any[],
  response: any,
  fetchedAt: number,
) {
  return reducer(
    state,
    actions.createSetResponse(endpoint, { args, response, fetchedAt } as any),
  );
}

/** Server pieces as the ledger holds them: parsed from the wire, objects recorded as placed */
function wire(states: State<unknown>[], placed: WeakSet<object>) {
  const pieces: PieceMessage[] = [];
  for (let i = 1; i < states.length; i++) {
    const slots = diffState(states[i - 1], states[i]);
    if (!slots) continue;
    const piece: PieceMessage = JSON.parse(
      JSON.stringify({ t: 'piece', at: 0, rev: pieces.length + 1, ...slots }),
    );
    for (const table of [piece.entities, piece.entitiesMeta]) {
      for (const key in table) {
        for (const pk in table[key]) {
          const value = table[key][pk];
          if (value && typeof value === 'object') placed.add(value);
        }
      }
    }
    pieces.push(piece);
  }
  return pieces;
}

function classes(...schemas: any[]): ClassMap {
  const manager = new StreamManager({} as any, 0);
  schemas.forEach(s => manager.learn(s));
  return manager.classes;
}

describe('applyPiece', () => {
  let warn: jest.SpiedFunction<typeof console.warn>;
  beforeEach(() => {
    // fixtures leave the `symbol` index out on purpose
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('takes a record the client lacks as is, and keeps identity of untouched records and tables', () => {
    const placed = new WeakSet<object>();
    const client = setResponse(
      initialState,
      getOther,
      [{ id: 'o' }],
      { id: 'o', value: 1 },
      5000,
    );
    const server1 = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100, symbol: 'btc' },
      1000,
    );
    const [piece] = wire([initialState, server1], placed);
    const next = applyPiece(client, piece, new Map(), placed, OPENED);
    expect(next.entities.Ticker!.BTC).toBe(piece.entities!.Ticker!.BTC);
    expect(next.entities.Other).toBe(client.entities.Other);
    expect(next.entitiesMeta.Other).toBe(client.entitiesMeta.Other);
    expect(next.indexes).toEqual({ Ticker: { symbol: { btc: 'BTC' } } });
    expect(next.endpoints[getTicker.key({ id: 'BTC' })]).toBe('BTC');
    expect(next.endpoints[getOther.key({ id: 'o' })]).toBe('o');
    // the input state is not changed
    expect(client.entities.Ticker).toBeUndefined();
  });

  it('replaces a record that is still the object a piece placed', () => {
    const placed = new WeakSet<object>();
    const s1 = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      1000,
    );
    const s2 = setResponse(
      s1,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 101 },
      2000,
    );
    const [p1, p2] = wire([initialState, s1, s2], placed);
    const live = applyPiece(initialState, p1, new Map(), placed, OPENED);
    const next = applyPiece(live, p2, classes(Ticker), placed, OPENED);
    // replaced: merging would have built a new object
    expect(next.entities.Ticker!.BTC).toBe(p2.entities!.Ticker!.BTC);
  });

  it('replaces a record whose only copy came from the seed', () => {
    const placed = new WeakSet<object>();
    const s1 = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      1000,
    );
    const s2 = setResponse(
      s1,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 101 },
      2000,
    );
    const pieces = wire([initialState, s1, s2], placed);
    const seed = foldPieces(pieces, 1);
    // no class is known: a client copy would be kept and the endpoint marked stale
    const next = applyPiece(seed, pieces[1], new Map(), placed, OPENED);
    expect((next.entities.Ticker!.BTC as any).price).toBe(101);
    const key = getTicker.key({ id: 'BTC' });
    expect(next.meta[key].expiresAt).toBe(pieces[1].meta![key]!.expiresAt);
    expect(next.meta[key].expiresAt).toBeGreaterThan(0);
  });

  it('merges a record the client wrote through its class: merge order and shouldUpdate', () => {
    const placed = new WeakSet<object>();
    const server = [
      initialState,
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 90, volume: 7 },
        1000,
      ),
    ];
    const [piece] = wire(server, placed);
    // the client wrote 100 later than the server's 90
    const client = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      2000,
    );
    const next = applyPiece(
      client,
      piece,
      classes(getTicker.schema),
      placed,
      OPENED,
    );
    // older server copy merges underneath: shouldReorder swaps, client price wins, volume fills in
    expect(next.entities.Ticker!.BTC).toEqual(
      Ticker.mergeWithStore(
        client.entitiesMeta.Ticker.BTC,
        piece.entitiesMeta!.Ticker!.BTC!,
        client.entities.Ticker!.BTC,
        piece.entities!.Ticker!.BTC,
      ),
    );
    expect(next.entities.Ticker!.BTC).toMatchObject({ price: 100, volume: 7 });
    // the client's endpoint is newer, so it is kept
    const key = getTicker.key({ id: 'BTC' });
    expect(next.meta[key]).toBe(client.meta[key]);

    const books = [
      initialState,
      setResponse(
        initialState,
        getBook,
        [{ id: 'b' }],
        { id: 'b', lastUpdateId: 510 },
        3000,
      ),
    ];
    const [bookPiece] = wire(books, placed);
    const held = setResponse(
      initialState,
      getBook,
      [{ id: 'b' }],
      { id: 'b', lastUpdateId: 520 },
      1000,
    );
    const kept = applyPiece(held, bookPiece, classes(Book), placed, OPENED);
    expect((kept.entities.Book!.b as any).lastUpdateId).toBe(520);
    const older = setResponse(
      initialState,
      getBook,
      [{ id: 'b' }],
      { id: 'b', lastUpdateId: 500 },
      1000,
    );
    const updated = applyPiece(older, bookPiece, classes(Book), placed, OPENED);
    expect((updated.entities.Book!.b as any).lastUpdateId).toBe(510);
  });

  it('lands a response whole when the client holds the record (split response)', () => {
    const placed = new WeakSet<object>();
    const client = reducer(
      initialState,
      actions.createSet(Ticker, {
        args: [{ id: 'BTC' }],
        value: { id: 'BTC', price: 100 },
        fetchedAt: 500,
      }) as any,
    );
    const server = [
      initialState,
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 101, volume: 7 },
        1000,
      ),
    ];
    const [piece] = wire(server, placed);
    const next = applyPiece(client, piece, classes(Ticker), placed, OPENED);
    const key = getTicker.key({ id: 'BTC' });
    expect(next.entities.Ticker!.BTC).toMatchObject({ price: 101, volume: 7 });
    expect(next.meta[key].expiresAt).toBe(piece.meta![key]!.expiresAt);
  });

  it('keeps a client-written record of unknown class and marks the piece endpoints stale', () => {
    const placed = new WeakSet<object>();
    const client = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      500,
    );
    const server = [
      initialState,
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 101, volume: 7 },
        1000,
      ),
    ];
    const [piece] = wire(server, placed);
    const next = applyPiece(client, piece, new Map(), placed, OPENED);
    expect(next.entities.Ticker!.BTC).toBe(client.entities.Ticker!.BTC);
    const key = getTicker.key({ id: 'BTC' });
    expect(next.meta[key].expiresAt).toBe(0);
    expect(next.meta[key].fetchedAt).toBe(1000);
  });

  it('unknown class: an endpoint the client fetched later than the piece is kept and not marked stale', () => {
    const placed = new WeakSet<object>();
    const getTickers = new Endpoint(() => Promise.resolve([] as any[]), {
      schema: [Ticker],
      name: 'getTickers',
    });
    const one = getTicker.key({ id: 'BTC' });
    const list = getTickers.key();
    const client = setResponse(
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 100 },
        500,
      ),
      getTickers,
      [],
      [{ id: 'BTC', price: 102 }],
      2000,
    );
    const atServer = setResponse(
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 101 },
        1000,
      ),
      getTickers,
      [],
      [{ id: 'BTC', price: 101 }],
      1000,
    );
    const [piece] = wire([initialState, atServer], placed);
    const unknown: string[] = [];
    const next = applyPiece(client, piece, new Map(), placed, OPENED, key =>
      unknown.push(key),
    );
    expect(next.entities.Ticker!.BTC).toBe(client.entities.Ticker!.BTC);
    expect(unknown).toEqual(['Ticker']);
    // taken from the piece, so stale
    expect(next.meta[one]).toMatchObject({ fetchedAt: 1000, expiresAt: 0 });
    // the client's own later response, as it was
    expect(next.meta[list]).toBe(client.meta[list]);
    expect(next.endpoints[list]).toBe(client.endpoints[list]);
  });

  it('takes an endpoint unless the client fetched it later', () => {
    const placed = new WeakSet<object>();
    const key = getTicker.key({ id: 'BTC' });
    const server = [
      initialState,
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 101 },
        1000,
      ),
    ];
    const [piece] = wire(server, placed);
    const newer = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      2000,
    );
    expect(
      applyPiece(newer, piece, classes(Ticker), placed, OPENED).meta[key],
    ).toBe(newer.meta[key]);
    const older = setResponse(
      initialState,
      getTicker,
      [{ id: 'BTC' }],
      { id: 'BTC', price: 100 },
      500,
    );
    expect(
      applyPiece(older, piece, classes(Ticker), placed, OPENED).meta[key],
    ).toBe(piece.meta![key]);
  });

  it('ignores a piece after a client RESET during the stream', () => {
    const placed = new WeakSet<object>();
    const server = [
      initialState,
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 101 },
        1000,
      ),
    ];
    const [piece] = wire(server, placed);
    const reset = reducer(initialState, actions.createReset() as any);
    expect(reset.lastReset).toBeGreaterThanOrEqual(OPENED);
    expect(applyPiece(reset, piece, new Map(), placed, OPENED)).toBe(reset);
    const before = { ...initialState, lastReset: OPENED - 1 };
    expect(applyPiece(before, piece, new Map(), placed, OPENED)).not.toBe(
      before,
    );
  });

  describe('removed (null) and INVALID (0) slots', () => {
    const placed = new WeakSet<object>();
    const removal: PieceMessage = {
      t: 'piece',
      at: 0,
      rev: 2,
      entities: { Ticker: { BTC: null } },
      entitiesMeta: { Ticker: { BTC: null } },
    };
    const invalid = (fetchedAt: number): PieceMessage => ({
      t: 'piece',
      at: 0,
      rev: 2,
      entities: { Ticker: { BTC: 0 } },
      entitiesMeta: {
        Ticker: { BTC: { fetchedAt, date: fetchedAt, expiresAt: fetchedAt } },
      },
    });
    const placedState = () => {
      const s1 = setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 1 },
        1000,
      );
      return foldPieces(wire([initialState, s1], placed), 1);
    };
    const clientState = () =>
      setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 1 },
        1000,
      );

    it('null removes an absent or placed record with its meta, and keeps a client one', () => {
      expect(
        applyPiece(initialState, removal, new Map(), placed, OPENED).entities
          .Ticker,
      ).toEqual({});
      const fromPiece = applyPiece(
        placedState(),
        removal,
        new Map(),
        placed,
        OPENED,
      );
      expect(fromPiece.entities.Ticker!.BTC).toBeUndefined();
      expect(fromPiece.entitiesMeta.Ticker.BTC).toBeUndefined();
      const client = clientState();
      const kept = applyPiece(client, removal, classes(Ticker), placed, OPENED);
      expect(kept.entities.Ticker!.BTC).toBe(client.entities.Ticker!.BTC);
    });

    it('0 is INVALID for an absent or placed record, and for a client one only when newer', () => {
      expect(
        applyPiece(initialState, invalid(900), new Map(), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toBe(INVALID);
      expect(
        applyPiece(placedState(), invalid(900), new Map(), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toBe(INVALID);
      const client = clientState();
      expect(
        applyPiece(client, invalid(900), classes(Ticker), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toBe(client.entities.Ticker!.BTC);
      expect(
        applyPiece(client, invalid(1100), classes(Ticker), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toBe(INVALID);
    });

    it('an object replaces a client INVALID only when its fetchedAt is not older', () => {
      const client = reducer(
        clientState(),
        actions.createInvalidate(getTicker, {
          args: [{ id: 'BTC' }],
        } as any) as any,
      );
      const withInvalid = {
        ...client,
        entities: { Ticker: { BTC: INVALID } },
      } as State<unknown>;
      const object = (fetchedAt: number): PieceMessage => ({
        t: 'piece',
        at: 0,
        rev: 2,
        entities: { Ticker: { BTC: { id: 'BTC', price: 5 } } },
        entitiesMeta: {
          Ticker: {
            BTC: { fetchedAt, date: fetchedAt, expiresAt: fetchedAt + 1 },
          },
        },
      });
      expect(
        applyPiece(withInvalid, object(999), classes(Ticker), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toBe(INVALID);
      expect(
        applyPiece(withInvalid, object(1000), classes(Ticker), placed, OPENED)
          .entities.Ticker!.BTC,
      ).toMatchObject({ price: 5 });
    });
  });

  describe('a removed table (null in its place), as a server reset sends', () => {
    const placed = new WeakSet<object>();
    const row = (id: string, price: number) => ({
      id,
      price,
      symbol: id.toLowerCase(),
    });
    const s1 = [row('BTC', 1), row('ETH', 2)].reduce(
      (state, ticker) =>
        setResponse(state, getTicker, [{ id: ticker.id }], ticker, 1000),
      initialState,
    );
    const server = reducer(s1, actions.createReset() as any);
    const [first, reset] = wire([initialState, s1, server], placed);
    const all = (state: State<unknown>) =>
      new Controller().get(new schema.All(Ticker), state);

    it('removes the table when every record in it came from the server', () => {
      expect(reset).toMatchObject({
        entities: { Ticker: null },
        entitiesMeta: { Ticker: null },
        indexes: { Ticker: null },
      });
      const seed = foldPieces([first], 1);
      expect(all(seed)).toHaveLength(2);
      const next = applyPiece(seed, reset, new Map(), placed, OPENED);
      expect(next.entities).toEqual({});
      expect(next.entitiesMeta).toEqual({});
      expect(next.indexes).toEqual({});
      // as on the server: no table reads as not loaded, an empty one as an empty list
      expect(all(server)).toBeUndefined();
      expect(all(next)).toBeUndefined();
    });

    it('keeps a record the client wrote, with its meta and its index entry', () => {
      const client = setResponse(
        foldPieces([first], 1),
        getTicker,
        [{ id: 'ETH' }],
        row('ETH', 5),
        3000,
      );
      const next = applyPiece(client, reset, classes(Ticker), placed, OPENED);
      expect(next.entities).toEqual({
        Ticker: { ETH: client.entities.Ticker!.ETH },
      });
      expect(next.entities.Ticker!.ETH).toBe(client.entities.Ticker!.ETH);
      expect(next.entitiesMeta).toEqual({
        Ticker: { ETH: client.entitiesMeta.Ticker.ETH },
      });
      expect(next.indexes).toEqual({ Ticker: { symbol: { eth: 'ETH' } } });
    });

    it('leaves the tables of a state that has no such table as they are', () => {
      const next = applyPiece(initialState, reset, new Map(), placed, OPENED);
      expect(next.entities).toBe(initialState.entities);
      expect(next.entitiesMeta).toBe(initialState.entitiesMeta);
      expect(next.indexes).toBe(initialState.indexes);
    });
  });

  describe('index entries', () => {
    const indexPiece = (pk: string): PieceMessage => ({
      t: 'piece',
      at: 0,
      rev: 2,
      entities: { Ticker: { [pk]: { id: pk, price: 9, symbol: 'new' } } },
      entitiesMeta: {
        Ticker: { [pk]: { fetchedAt: 900, date: 900, expiresAt: 2000 } },
      },
      indexes: { Ticker: { symbol: { new: pk, old: 0 } } },
    });

    it('applies an entry as sent for a taken record', () => {
      const next = applyPiece(
        initialState,
        indexPiece('BTC'),
        new Map(),
        new WeakSet(),
        OPENED,
      );
      expect(next.indexes.Ticker!.symbol).toEqual({ new: 'BTC', old: INVALID });
    });

    it('recomputes the entry from the merged record for a known class', () => {
      const client = setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 1, symbol: 'old' },
        1000,
      );
      const piece = indexPiece('BTC');
      const next = applyPiece(
        client,
        piece,
        classes(Ticker),
        new WeakSet(),
        OPENED,
      );
      // client copy is newer, so merged symbol stays 'old'
      expect((next.entities.Ticker!.BTC as any).symbol).toBe('old');
      expect(next.indexes.Ticker!.symbol).toEqual({ old: 'BTC' });
      const older = setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 1, symbol: 'old' },
        500,
      );
      const moved = applyPiece(
        older,
        piece,
        classes(Ticker),
        new WeakSet(),
        OPENED,
      );
      expect(moved.indexes.Ticker!.symbol).toEqual({
        old: INVALID,
        new: 'BTC',
      });
    });

    it('skips the entry for a kept record', () => {
      const client = setResponse(
        initialState,
        getTicker,
        [{ id: 'BTC' }],
        { id: 'BTC', price: 1, symbol: 'old' },
        1000,
      );
      const next = applyPiece(
        client,
        indexPiece('BTC'),
        new Map(),
        new WeakSet(),
        OPENED,
      );
      expect(next.indexes.Ticker!.symbol).toBe(client.indexes.Ticker!.symbol);
    });
  });

  describe('Collection', () => {
    class Todo extends Entity {
      id = '';
      title = '';
      static key = 'Todo';
    }
    const TodoResource = resource({ path: '/todos/:id', schema: Todo });

    it('learns classes through nested schemas, a Collection and its push', () => {
      class Author extends Entity {
        id = '';
        static key = 'Author';
      }
      class Post extends Entity {
        id = '';
        author = Author.fromJS();
        static key = 'Post';
        static schema = { author: Author };
      }
      const learned = classes({ data: [Post] }, TodoResource.getList.push);
      expect(learned.get('Post')).toBe(Post);
      expect(learned.get('Author')).toBe(Author);
      expect(learned.get('Todo')).toBe(Todo);
      const collection = TodoResource.getList.schema as any as Collection;
      expect(learned.get(collection.key)).toBe(collection);
    });

    it("merges a list the client pushed to with master's list rule", () => {
      const placed = new WeakSet<object>();
      const list = (titles: string[]) =>
        titles.map((title, i) => ({ id: String(i), title }));
      const s1 = setResponse(
        initialState,
        TodoResource.getList,
        [],
        list(['a', 'b']),
        1000,
      );
      const [p1] = wire([initialState, s1], placed);
      const seeded = applyPiece(initialState, p1, new Map(), placed, OPENED);
      // the client pushes after the server rendered
      const pushed = setResponse(
        seeded,
        TodoResource.getList.push,
        [],
        { id: '9', title: 'mine' },
        3000,
      );
      const s2 = setResponse(
        s1,
        TodoResource.getList,
        [],
        list(['a', 'b', 'c']),
        2000,
      );
      const [, p2] = wire([initialState, s1, s2], placed);
      const learned = classes(TodoResource.getList.push);
      const next = applyPiece(pushed, p2, learned, placed, OPENED);
      const expected = setResponse(
        pushed,
        TodoResource.getList,
        [],
        list(['a', 'b', 'c']),
        2000,
      );
      const key = (TodoResource.getList.schema as any).key;
      expect(next.entities[key]).toEqual(expected.entities[key]);
      expect(Object.values(next.entities[key]!)[0]).toContain('9');

      // a server list newer than the client's write replaces it, as master does
      const s3 = setResponse(s2, TodoResource.getList, [], list(['x']), 4000);
      const [, , p3] = wire([initialState, s1, s2, s3], placed);
      const replaced = applyPiece(next, p3, learned, placed, OPENED);
      const expected3 = setResponse(
        next,
        TodoResource.getList,
        [],
        list(['x']),
        4000,
      );
      expect(replaced.entities[key]).toEqual(expected3.entities[key]);
    });
  });

  it("is StreamManager's rdc/apply action, which core's reducer applies", () => {
    const ledger: any = { placed: new WeakSet(), openedAt: OPENED };
    const manager = new StreamManager(ledger, 0);
    const controller = new Controller();
    manager.middleware(controller as any);
    const reduce = createReducer(controller);
    const piece: PieceMessage = {
      t: 'piece',
      at: 0,
      rev: 1,
      endpoints: { k: 1 },
      meta: { k: { fetchedAt: 1, date: 1, expiresAt: 2 } },
    };
    const action = (manager as any).pieceAction(piece);
    expect(action.type).toBe(APPLY);
    expect(action.piece).toBe(piece);
    expect(reduce(initialState, action).endpoints).toEqual({ k: 1 });
    expect((controller as any).reduce).toBeUndefined();
  });
});

describe('applyPiece, a client write that keeps the server object', () => {
  class Quote extends Entity {
    id = '';
    price = 0;
    static key = 'Quote';
    // skips the write when nothing changed, so the stored object stays
    static shouldUpdate(_em: any, _im: any, existing: any, incoming: any) {
      return existing.price !== incoming.price;
    }
  }
  const getQuote = new Endpoint(
    ({ id }: { id: string }) => Promise.resolve({ id } as any),
    { schema: Quote, name: 'getQuote' },
  );
  const set = (state: State<unknown>, price: number, fetchedAt: number) =>
    setResponse(state, getQuote, [{ id: 'q' }], { id: 'q', price }, fetchedAt);
  const quote = (state: State<unknown>) => [
    (state.entities.Quote as any).q.price,
    (state.entitiesMeta.Quote as any).q.fetchedAt,
  ];

  it('merges an older piece under it through the class, as any other write would', () => {
    const placed = new WeakSet<object>();
    const server1 = set(initialState, 1, 1000);
    const server2 = set(server1, 5, 2000);
    const [p1, p2] = wire([initialState, server1, server2], placed);
    const seed = foldPieces([p1], 1);
    // the client fetches the same value after the server's second response
    const client = set(seed, 1, 3000);
    expect(client.entities.Quote!.q).toBe(seed.entities.Quote!.q);
    expect(quote(client)).toEqual([1, 3000]);

    const next = applyPiece(client, p2, classes(Quote), placed, OPENED);
    expect(quote(next)).toEqual(quote(set(client, 5, 2000)));
    expect(quote(next)).toEqual([1, 3000]);
  });

  it('stays a client write after a merge that keeps the object and takes the piece meta', () => {
    const placed = new WeakSet<object>();
    const book = (
      state: State<unknown>,
      lastUpdateId: number,
      fetchedAt: number,
    ) =>
      setResponse(
        state,
        getBook,
        [{ id: 'b' }],
        { id: 'b', lastUpdateId },
        fetchedAt,
      );
    // the server holds 10, resets, and its new source starts again at 3
    const reset = Date.now();
    const server1 = book(initialState, 10, reset - 3000);
    const server2 = reducer(server1, actions.createReset() as any);
    const server3 = book(server2, 3, reset + 2000);
    const server4 = book(server3, 4, reset + 3000);
    const [p1, ...later] = wire(
      [initialState, server1, server2, server3, server4],
      placed,
    );
    expect(later).toHaveLength(3);
    // Book turns the client's older response down: the object stays, the meta moves
    const client = book(foldPieces([p1], 1), 8, reset + 1000);
    const held = client.entities.Book!.b;
    expect(placed.has(held as object)).toBe(true);

    const next = later.reduce(
      (state, piece) => applyPiece(state, piece, classes(Book), placed, OPENED),
      client,
    );
    // as the reducer does with the same two responses: Book keeps 10 over 3 and over 4
    const viaReducer = book(book(client, 3, reset + 2000), 4, reset + 3000);
    expect(viaReducer.entities.Book!.b).toBe(held);
    expect(next.entities.Book!.b).toBe(held);
    expect(next.entitiesMeta.Book.b.fetchedAt).toBe(
      viaReducer.entitiesMeta.Book.b.fetchedAt,
    );
  });

  it('still replaces the record when the client never wrote it', () => {
    const placed = new WeakSet<object>();
    const server1 = set(initialState, 1, 1000);
    const server2 = set(server1, 5, 2000);
    const [p1, p2] = wire([initialState, server1, server2], placed);
    const seed = foldPieces([p1], 1);
    const next = applyPiece(seed, p2, new Map(), placed, OPENED);
    expect(next.entities.Quote!.q).toBe(p2.entities!.Quote!.q);
    expect(quote(next)).toEqual([5, 2000]);
  });
});
