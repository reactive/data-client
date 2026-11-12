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
  const ledger = createServerLedger(() => 10_000);
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
