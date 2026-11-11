import {
  Controller,
  NetworkManager,
  actions,
  applyManager,
  createReducer,
  initialState,
} from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';

import { PromiseifyMiddleware } from '../../redux/index.js';
import { applyMiddleware, createStore } from '../../redux/redux.js';
import { createServerLedger } from '../ServerLedger';

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
  it('sends open first, with the revision and the server clock', () => {
    const { ledger, set } = setup();
    set('BTC', 100);
    const messages = ledger.take();
    expect(messages[0]).toEqual({ t: 'open', v: 1, rev: 1, at: 5000 });
    expect(messages.map(m => m.t)).toEqual(['open', 'piece']);
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
      store.getState().entities.Ticker.ETH,
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
});
