import {
  Controller,
  actions,
  createReducer,
  initialState,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';

import { applyPiece } from '../applyPiece';
import { getLedger } from '../Ledger';
import { serialize } from '../serialize';
import { createServerLedger } from '../ServerLedger';
import { STREAM_GLOBAL } from '../wire';
import type { PieceMessage } from '../wire';

const getValue = new Endpoint(
  ({ name }: { name: string }) => Promise.resolve(null as unknown),
  { name: 'getValue' },
);
const reducer = createReducer(new Controller());

/** A server store the ledger records, written by `set` */
function serverStore() {
  let state: State<unknown> = initialState;
  const listeners = new Set<() => void>();
  const store = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const ledger = createServerLedger();
  ledger.attach(store as any);
  return {
    ledger,
    write(next: State<unknown>) {
      state = next;
      listeners.forEach(listener => listener());
    },
    state: () => state,
  };
}
const resolve = (
  state: State<unknown>,
  name: string,
  response: unknown,
  fetchedAt = 10_000,
) =>
  reducer(
    state,
    actions.createSetResponse(getValue, {
      args: [{ name }],
      response,
      fetchedAt,
    }),
  );
const keyOf = (name: string) => getValue.key({ name });

/** The server's scripts, run as the parser would; returns the document's ledger */
function deliver(scripts: string[]) {
  for (const source of scripts) new Function(source)();
  return getLedger()!;
}

describe('endpoint values over the stream', () => {
  let now: jest.SpiedFunction<typeof Date.now>;
  beforeEach(() => {
    delete (globalThis as any)[STREAM_GLOBAL];
    now = jest.spyOn(Date, 'now').mockReturnValue(10_000);
  });
  afterEach(() => {
    now.mockRestore();
    delete (globalThis as any)[STREAM_GLOBAL];
  });

  const values: [string, unknown][] = [
    ['null', null],
    ['0', 0],
    ['false', false],
    ["''", ''],
  ];
  for (const [label, value] of values)
    it(`a schema-less endpoint that resolved ${label} is ${label} after seed, applyPiece and in a snapshot`, () => {
      const server = serverStore();
      const shell = serialize(server.ledger.take());
      server.write(resolve(server.state(), 'v', value));
      const later = serialize(server.ledger.take());
      const ledger = deliver([shell, later]);
      const key = keyOf('v');

      const seed = ledger.fold(ledger.rev);
      expect(key in seed.endpoints).toBe(true);
      expect(seed.endpoints[key]).toBe(value);
      expect(seed.meta[key].fetchedAt).toBe(10_000);
      expect(ledger.snapshot(ledger.rev).endpoints[key]).toBe(value);

      // the client held an older result for the key
      const client = resolve(initialState, 'v', 'stale', 5_000);
      const [piece] = ledger.after(0);
      const applied = applyPiece(
        client,
        piece,
        new Map(),
        ledger.placed,
        ledger.openedAt,
      );
      expect(key in applied.endpoints).toBe(true);
      expect(applied.endpoints[key]).toBe(value);
      expect(applied.meta[key].fetchedAt).toBe(10_000);
    });

  describe("another endpoint's update(), which leaves that endpoint's meta alone", () => {
    const getIds = new Endpoint(() => Promise.resolve([] as string[]), {
      name: 'getIds',
    });
    const createId = new Endpoint(
      ({ id }: { id: string }) => Promise.resolve(id),
      {
        name: 'createId',
        sideEffect: true,
        update: (id: string) => ({
          [getIds.key()]: (ids: string[] = []) => [...ids, id],
        }),
      },
    );
    const idsKey = getIds.key();
    const setIds = (
      state: State<unknown>,
      response: string[],
      fetchedAt: number,
    ) =>
      reducer(
        state,
        actions.createSetResponse(getIds, { args: [], response, fetchedAt }),
      );

    /** The server holds ['1'] in the shell, then creates '2' at server time 11_000 */
    function serverPiece(withIds = true) {
      const server = serverStore();
      if (withIds) server.write(setIds(server.state(), ['1'], 10_000));
      const shell = serialize(server.ledger.take());
      now.mockReturnValue(11_000);
      server.write(
        reducer(
          server.state(),
          actions.createSetResponse(createId, {
            args: [{ id: '2' }],
            response: '2',
            fetchedAt: 11_000,
          }),
        ),
      );
      const later = serialize(server.ledger.take());
      // the client's clock is 1s ahead of the server's
      now.mockReturnValue(11_000);
      const ledger = deliver([shell]);
      now.mockReturnValue(12_000);
      deliver([later]);
      const [piece] = ledger.after(ledger.shellRev!);
      expect(piece.endpoints![idsKey]).toEqual(withIds ? ['1', '2'] : ['2']);
      expect(piece.meta?.[idsKey]).toBeUndefined();
      return { ledger, piece };
    }
    const apply = (
      client: State<unknown>,
      { ledger, piece }: ReturnType<typeof serverPiece>,
    ) => applyPiece(client, piece, new Map(), ledger.placed, ledger.openedAt);

    it('keeps the list the client fetched after the change', () => {
      const run = serverPiece();
      // the change happened at client time 12_000; the client fetched at 12_500
      const client = setIds(initialState, ['1', '2', '3'], 12_500);
      expect(apply(client, run).endpoints[idsKey]).toEqual(['1', '2', '3']);
    });

    it('takes the list when the client fetched it before the change', () => {
      const run = serverPiece();
      const client = setIds(initialState, ['1'], 11_500);
      expect(apply(client, run).endpoints[idsKey]).toEqual(['1', '2']);
    });

    it('takes the list for a key the client lacks', () => {
      const run = serverPiece(false);
      expect(apply(initialState, run).endpoints[idsKey]).toEqual(['2']);
    });
  });

  it('a removed endpoint result is removed; its meta stays when only the result went', () => {
    const server = serverStore();
    server.write(resolve(server.state(), 'v', 5));
    server.write(resolve(server.state(), 'w', 6));
    const shell = serialize(server.ledger.take());
    // invalidate drops the result and keeps a meta; GC-like drops both
    server.write(
      reducer(
        server.state(),
        actions.createInvalidate(getValue, { args: [{ name: 'v' }] }),
      ),
    );
    const { [keyOf('w')]: _e, ...endpoints } = server.state().endpoints;
    const { [keyOf('w')]: _m, ...meta } = server.state().meta;
    server.write({ ...server.state(), endpoints, meta });
    const later = serialize(server.ledger.take());
    const ledger = deliver([shell, later]);
    const pieces: readonly PieceMessage[] = ledger.after(ledger.shellRev!);
    expect(pieces).toHaveLength(2);

    const shellState = ledger.fold(ledger.shellRev!);
    expect(shellState.endpoints).toEqual({ [keyOf('v')]: 5, [keyOf('w')]: 6 });
    const end = ledger.fold(ledger.rev);
    expect(end.endpoints).toEqual({});
    expect(end.meta[keyOf('v')].invalidated).toBe(true);
    expect(keyOf('w') in end.meta).toBe(false);

    let client = shellState;
    for (const piece of pieces)
      client = applyPiece(
        client,
        piece,
        new Map(),
        ledger.placed,
        ledger.openedAt,
      );
    expect(client.endpoints).toEqual({});
    expect(client.meta[keyOf('v')].invalidated).toBe(true);
    expect(keyOf('w') in client.meta).toBe(false);
  });
});
