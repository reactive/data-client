import {
  Controller,
  actions,
  createReducer,
  initialState,
  __INTERNAL__,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';

import { foldPieces } from '../applyPiece';
import { diffState } from '../diffState';
import type { PieceMessage } from '../wire';

class Ticker extends Entity {
  id = '';
  price = 0;
  static key = 'Ticker';
  static indexes = ['price'] as const;
}
const getTicker = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, price: 0 }),
  { schema: Ticker, name: 'getTicker' },
);
const getTickers = new Endpoint(
  () => Promise.resolve([] as { id: string; price: number }[]),
  {
    schema: [Ticker],
    name: 'getTickers',
  },
);

const reducer = createReducer(new Controller());
const set = (
  state: State<unknown>,
  id: string,
  price: number,
  fetchedAt = 1000,
) =>
  reducer(
    state,
    actions.createSetResponse(getTicker, {
      args: [{ id }],
      response: { id, price },
      fetchedAt,
    }),
  );

describe('diffState', () => {
  it('returns undefined when nothing changed', () => {
    const s1 = set(initialState, 'BTC', 100);
    expect(diffState(s1, s1)).toBeUndefined();
    expect(diffState(s1, { ...s1 })).toBeUndefined();
  });

  it('sends added slots per table', () => {
    const s1 = set(initialState, 'BTC', 100);
    const slots = diffState(initialState, s1)!;
    expect(slots.entities).toEqual({
      Ticker: { BTC: { id: 'BTC', price: 100 } },
    });
    expect(slots.entities!.Ticker!.BTC).toBe(s1.entities.Ticker!.BTC);
    expect(Object.keys(slots.entitiesMeta!.Ticker!)).toEqual(['BTC']);
    expect(slots.indexes).toEqual({ Ticker: { price: { 100: 'BTC' } } });
    const key = getTicker.key({ id: 'BTC' });
    expect(slots.endpoints).toEqual({ [key]: 'BTC' });
    expect(slots.meta![key]).toEqual({
      date: s1.meta[key].date,
      fetchedAt: 1000,
      expiresAt: s1.meta[key].expiresAt,
    });
  });

  it('sends only the changed slot, and nothing for unchanged tables', () => {
    const s1 = set(set(initialState, 'BTC', 100), 'ETH', 10);
    const s2 = set(s1, 'ETH', 11, 2000);
    const slots = diffState(s1, s2)!;
    expect(Object.keys(slots.entities!.Ticker!)).toEqual(['ETH']);
    expect(slots.endpoints).toBeUndefined();
    expect(Object.keys(slots.meta!)).toEqual([getTicker.key({ id: 'ETH' })]);
    // the old price is INVALID, the new one points at ETH
    expect(slots.indexes).toEqual({ Ticker: { price: { 10: 0, 11: 'ETH' } } });

    const s3 = { ...s2, endpoints: { ...s2.endpoints, extra: 5 } };
    expect(diffState(s2, s3)).toEqual({ endpoints: { extra: 5 } });
  });

  it('sends removed entity slots as null, removed endpoints in x, and INVALID as 0', () => {
    const s1 = set(set(initialState, 'BTC', 100), 'ETH', 10);
    const btcKey = getTicker.key({ id: 'BTC' });
    const without = <T extends object>(table: T, key: string): T => {
      const { [key]: _, ...rest } = table as any;
      return rest;
    };
    const s2: State<unknown> = {
      ...s1,
      entities: { Ticker: without(s1.entities.Ticker!, 'BTC') },
      entitiesMeta: { Ticker: without(s1.entitiesMeta.Ticker, 'BTC') },
      endpoints: without(s1.endpoints, btcKey),
      meta: without(s1.meta, btcKey),
    };
    expect(diffState(s1, s2)).toEqual({
      entities: { Ticker: { BTC: null } },
      entitiesMeta: { Ticker: { BTC: null } },
      x: [btcKey],
    });
    // an endpoint result of null is a value
    const s2null = { ...s2, endpoints: { ...s2.endpoints, [btcKey]: null } };
    expect(diffState(s2, s2null)).toEqual({ endpoints: { [btcKey]: null } });
    // a result removed while its meta stays sends the meta again
    const ethKey = getTicker.key({ id: 'ETH' });
    const s2kept = { ...s2, endpoints: without(s2.endpoints, ethKey) };
    expect(diffState(s2, s2kept)).toEqual({
      meta: { [ethKey]: s2.meta[ethKey] },
      x: [ethKey],
    });
    // a table that is gone is null in the table's place
    const s3 = { ...s2, entities: {} };
    expect(diffState(s2, s3)!.entities).toEqual({ Ticker: null });

    const s4 = {
      ...s2,
      entities: {
        Ticker: { ...s2.entities.Ticker, ETH: __INTERNAL__.INVALID },
      },
    };
    expect(diffState(s2, s4)).toEqual({ entities: { Ticker: { ETH: 0 } } });
  });

  it('sends an endpoint error as name, message and status', () => {
    const error: any = new Error('nope');
    error.status = 503;
    const s1 = reducer(
      initialState,
      actions.createSetResponse(getTicker, {
        args: [{ id: 'BTC' }],
        response: error,
        error: true,
        fetchedAt: 1000,
      }),
    );
    const slots = diffState(initialState, s1)!;
    expect(slots.meta![getTicker.key({ id: 'BTC' })]!.error).toEqual({
      name: 'Error',
      message: 'nope',
      status: 503,
    });
  });

  it('sends the tables a reset removes as null, and a fold of it has no table', () => {
    const s1 = set(initialState, 'BTC', 100);
    const s2 = reducer(s1, actions.createReset());
    const s3 = set(s2, 'ETH', 10);
    const slots = diffState(s1, s2);
    expect(slots).toEqual({
      entities: { Ticker: null },
      entitiesMeta: { Ticker: null },
      indexes: { Ticker: null },
      x: [getTicker.key({ id: 'BTC' })],
    });
    const pieces: PieceMessage[] = JSON.parse(
      JSON.stringify(
        [diffState(initialState, s1), slots, diffState(s2, s3)].map(
          (piece, i) => ({ t: 'piece', at: 0, rev: i + 1, ...piece }),
        ),
      ),
    );
    const asFolded = (state: State<unknown>) => ({
      ...state,
      optimistic: [],
      lastReset: 0,
    });
    expect(foldPieces(pieces, 2)).toEqual(asFolded(s2));
    expect(foldPieces(pieces, 3)).toEqual(asFolded(s3));
  });

  it('round trips: foldPieces of the diffs equals the server state', () => {
    const states = [initialState];
    const push = (next: State<unknown>) => states.push(next);
    push(set(states.at(-1)!, 'BTC', 100, 1000));
    push(
      reducer(
        states.at(-1)!,
        actions.createSetResponse(getTickers, {
          args: [],
          response: [
            { id: 'BTC', price: 101 },
            { id: 'ETH', price: 10 },
          ],
          fetchedAt: 2000,
        }),
      ),
    );
    push(set(states.at(-1)!, 'ETH', 12, 3000));
    push({
      ...states.at(-1)!,
      endpoints: Object.fromEntries(
        Object.entries(states.at(-1)!.endpoints).filter(
          ([key]) => key !== getTicker.key({ id: 'BTC' }),
        ),
      ),
      meta: Object.fromEntries(
        Object.entries(states.at(-1)!.meta).filter(
          ([key]) => key !== getTicker.key({ id: 'BTC' }),
        ),
      ),
    });
    const pieces: PieceMessage[] = [];
    for (let i = 1; i < states.length; i++) {
      const slots = diffState(states[i - 1], states[i]);
      if (slots)
        pieces.push({ t: 'piece', at: 0, rev: pieces.length + 1, ...slots });
    }
    expect(pieces).toHaveLength(4);
    const wire = JSON.parse(JSON.stringify(pieces));
    const last = states.at(-1)!;
    const folded = foldPieces(wire, 4);
    expect(folded).toEqual({ ...last, optimistic: [], lastReset: 0 });
    expect(folded.indexes.Ticker!.price[10]).toBe(__INTERNAL__.INVALID);
    // an earlier revision folds to that state
    expect(foldPieces(wire, 2).entities).toEqual(
      JSON.parse(JSON.stringify(states[2].entities)),
    );
  });
});
