import {
  Controller,
  NetworkManager,
  actionTypes,
  actions,
  applyManager,
  createReducer,
  initialState,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';

import { PromiseifyMiddleware } from '../../redux/index.js';
import { applyMiddleware, createStore } from '../../redux/redux.js';
import { foldPieces } from '../applyPiece';
import createServerStream from '../createServerStream';
import { createServerLedger } from '../ServerLedger';
import type { StreamMessage } from '../wire';

class Ticker extends Entity {
  id = '';
  price = 0;
  static key = 'Ticker';
}
const getTicker = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, price: 1 }),
  { schema: Ticker, name: 'getTicker' },
);

function setup() {
  let clock = 5000;
  const ledger = createServerLedger(() => clock++);
  const controller = new Controller();
  const store = createStore(
    createReducer(controller),
    initialState as any,
    applyMiddleware(
      ...(applyManager(
        [ledger.manager, new NetworkManager()],
        controller,
      ) as any),
      PromiseifyMiddleware as any,
    ),
  );
  ledger.attach(store as any);
  const set = (id: string, price: number) =>
    store.dispatch(
      actions.createSetResponse(getTicker, {
        args: [{ id }],
        response: { id, price },
      }) as any,
    );
  return { ledger, store, controller, set };
}

describe('createServerLedger', () => {
  it('sends open first, with the revision and the server clock; each piece has the clock when recorded', () => {
    const { ledger, set } = setup();
    set('BTC', 100);
    const messages = ledger.take();
    expect(messages[0]).toEqual({ t: 'open', v: 1, rev: 1, at: 5001 });
    expect(messages.map(m => m.t)).toEqual(['open', 'piece']);
    expect(messages[1]).toMatchObject({ t: 'piece', rev: 1, at: 5000 });
    expect(ledger.take()).toEqual([]);
  });

  it('records one piece per committed change, in order', () => {
    const { ledger, store, set } = setup();
    ledger.take();
    set('BTC', 100);
    set('ETH', 10);
    set('ETH', 10);
    const pieces = ledger.take();
    expect(pieces.map(m => m.t === 'piece' && m.rev)).toEqual([1, 2, 3]);
    expect((pieces[2] as any).entities.Ticker.ETH).toBe(
      store.getState().entities.Ticker!.ETH,
    );
    // a dispatch that leaves the state as it is records nothing
    store.dispatch({ type: 'unknown' } as any);
    expect(ledger.take()).toEqual([]);
  });

  it('sends a pin when new and again when it moves; a scope pins only its id', () => {
    const { ledger, set } = setup();
    const outer = ledger.scope('outer');
    expect(ledger.scope('outer')).toBe(outer);
    const inner = ledger.scope('inner');
    outer.getState();
    set('BTC', 100);
    inner.getState();
    expect(ledger.take()).toEqual([
      expect.objectContaining({ t: 'open' }),
      expect.objectContaining({ t: 'piece', rev: 1 }),
      { t: 'pin', id: 'outer', rev: 0 },
      { t: 'pin', id: 'inner', rev: 1 },
    ]);
    outer.getState();
    inner.getState();
    expect(ledger.take()).toEqual([{ t: 'pin', id: 'outer', rev: 1 }]);
    // last read wins
    set('BTC', 101);
    inner.getState();
    expect(ledger.take()).toEqual([
      expect.objectContaining({ t: 'piece', rev: 2 }),
      { t: 'pin', id: 'inner', rev: 2 },
    ]);
  });

  it('pins a scope at creation, names its parent, and a nested read moves only the nested pin', () => {
    const { ledger, set } = setup();
    set('BTC', 100);
    const outer = ledger.scope('outer');
    expect(outer.boundaryId).toBe('outer');
    set('BTC', 101);
    const inner = ledger.scope('inner', 'outer');
    set('BTC', 102);
    inner.getState();
    expect(ledger.take().filter(m => m.t === 'pin')).toEqual([
      { t: 'pin', id: 'outer', rev: 1 },
      { t: 'pin', id: 'inner', rev: 3, p: 'outer' },
    ]);
    // the same view; creating it again does not move the pin
    set('BTC', 103);
    expect(ledger.scope('outer')).toBe(outer);
    expect(ledger.take().filter(m => m.t === 'pin')).toEqual([]);
  });

  it('announces each fetched key once', async () => {
    const { ledger, controller } = setup();
    ledger.take();
    await Promise.all([
      controller.fetch(getTicker, { id: 'BTC' }),
      controller.fetch(getTicker, { id: 'BTC' }),
    ]);
    await controller.fetch(getTicker, { id: 'ETH' });
    const announcements = ledger.take().filter(m => m.t === 'ann');
    expect(announcements).toEqual([
      {
        t: 'ann',
        keys: [getTicker.key({ id: 'BTC' }), getTicker.key({ id: 'ETH' })],
      },
    ]);
    await controller.fetch(getTicker, { id: 'BTC' });
    expect(ledger.take().filter(m => m.t === 'ann')).toEqual([]);
  });

  it('end sends what is left and then end, once', () => {
    const { ledger, set } = setup();
    ledger.take();
    set('BTC', 100);
    const last = ledger.end();
    expect(last.map(m => m.t)).toEqual(['piece', 'end']);
    expect(ledger.end()).toEqual([]);
    expect(ledger.take()).toEqual([]);
  });

  it('K6: through the server store, foldPieces of everything taken equals its state after fetch, invalidate, reset and GC', async () => {
    const { controller, ledger } = createServerStream();
    const getTickers = new Endpoint(
      () =>
        Promise.resolve([
          { id: 'BTC', price: 2 },
          { id: 'ETH', price: 3 },
        ]),
      { schema: [Ticker], name: 'getTickers' },
    );
    // a fold keeps a table whose records were all deleted; the store may not
    const dropEmpty = (state: State<unknown>) => {
      const nonEmpty = (tables: { [key: string]: object | undefined }) =>
        Object.fromEntries(
          Object.entries(tables).filter(
            ([, table]) => Object.keys(table ?? {}).length,
          ),
        );
      return {
        ...state,
        entities: nonEmpty(state.entities),
        entitiesMeta: nonEmpty(state.entitiesMeta),
        indexes: nonEmpty(state.indexes),
      };
    };
    const taken: StreamMessage[] = [];
    const takeAndFold = () => {
      taken.push(...ledger.take());
      const wire = JSON.parse(
        JSON.stringify(taken.filter(m => m.t === 'piece')),
      );
      return dropEmpty(foldPieces(wire, Infinity));
    };
    const serverState = () =>
      dropEmpty({
        ...controller.getState(),
        optimistic: [],
        lastReset: 0,
      });
    const fetchBoth = () =>
      Promise.all([
        controller.fetch(getTicker, { id: 'BTC' }),
        controller.fetch(getTickers),
      ]);

    await fetchBoth();
    expect(controller.getState().entities.Ticker).toHaveProperty('ETH');
    expect(takeAndFold()).toEqual(serverState());

    await controller.invalidate(getTicker, { id: 'BTC' });
    expect(controller.getState().endpoints).not.toHaveProperty(
      getTicker.key({ id: 'BTC' }),
    );
    expect(takeAndFold()).toEqual(serverState());

    await controller.resetEntireStore();
    expect(controller.getState().entities).toEqual({});
    expect(takeAndFold()).toEqual(serverState());

    await fetchBoth();
    expect(takeAndFold()).toEqual(serverState());

    // core's reducer deletes a GC's entries in place and returns the same state object
    const before = controller.getState();
    await controller.dispatch({
      type: actionTypes.GC,
      entities: [{ key: 'Ticker', pk: 'ETH' }],
      endpoints: [getTickers.key()],
    });
    expect(controller.getState()).toBe(before);
    expect(controller.getState().entities.Ticker).not.toHaveProperty('ETH');
    expect(controller.getState().endpoints).not.toHaveProperty(
      getTickers.key(),
    );
    expect(takeAndFold()).toEqual(serverState());
  });
});
