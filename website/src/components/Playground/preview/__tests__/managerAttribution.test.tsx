/// <reference types="jest" />
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  actionTypes,
  DataProvider,
  NetworkManager,
  PollingSubscription,
  SubscriptionManager,
  useController,
  useSuspense,
  type ActionTypes,
  type Controller,
  type Manager,
  type Middleware,
} from '@data-client/react';
import { act, render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { managerNames } from '../store/attribution';
import SchemaRegistry from '../store/schemaRegistry';

class Ticker extends Entity {
  id = '';
  price = 0;
}

/** Pushes tickers with `controller.set`, and handles subscribes itself */
class StreamManager implements Manager<ActionTypes> {
  declare controller: Controller;
  middleware: Middleware<ActionTypes> = controller => {
    this.controller = controller;
    return next => action =>
      action.type === actionTypes.SUBSCRIBE ? Promise.resolve() : next(action);
  };

  push(price: number) {
    return this.controller.set(Ticker, { id: 'BTC' }, { id: 'BTC', price });
  }

  cleanup() {}
}

/** Passes everything on, after a tick */
class SlowManager implements Manager<ActionTypes> {
  middleware: Middleware<ActionTypes> = () => next => async action => {
    await Promise.resolve();
    return next(action);
  };

  cleanup() {}
}

const getTicker = new Endpoint(async () => ({ id: 'BTC', price: 1 }), {
  schema: Ticker,
  key: () => 'GET /ticker',
  name: 'getTicker',
});

function mount(own: Manager[], preview?: React.ReactNode) {
  const registry = new SchemaRegistry({ trimEvery: 1 });
  const log = registry.log.connect(0);
  const managers = [log.head, registry, ...log.track(own), log.tail];
  const ref: { ctrl?: Controller } = {};
  function Grab() {
    ref.ctrl = useController();
    return null;
  }
  render(
    <DataProvider managers={managers} devButton={null}>
      <Grab />
      <Suspense fallback="loading">{preview}</Suspense>
    </DataProvider>,
  );
  return {
    ctrl: () => ref.ctrl!,
    history: () => registry.log.history(0),
    entries: () =>
      registry.log.history(0).entries.map(e => ({
        type: e.action.type,
        origin: e.origin,
        consumedBy: e.consumedBy,
      })),
  };
}

describe('manager attribution', () => {
  it('names the chain in order, numbering repeats', () => {
    const stream = new StreamManager();
    const { history } = mount([
      stream,
      new StreamManager(),
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ]);
    act(() => {
      stream.push(1);
    });
    expect(history().managers).toEqual([
      'StreamManager',
      'StreamManager #2',
      'NetworkManager',
      'SubscriptionManager',
    ]);
  });

  it('knows library managers by class, not by their (minified) name', () => {
    class e extends NetworkManager {}
    expect(
      managerNames([new e(), { middleware: () => (n: unknown) => n } as any]),
    ).toEqual(['NetworkManager', 'Object']);
  });

  it("credits what a manager sends through its controller, not the app's", async () => {
    const stream = new StreamManager();
    const { ctrl, entries } = mount([stream, new NetworkManager()]);
    await act(async () => {
      void stream.push(2);
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    expect(entries()).toEqual([
      { type: actionTypes.SET, origin: 'StreamManager', consumedBy: undefined },
      { type: actionTypes.SET, origin: undefined, consumedBy: undefined },
    ]);
  });

  it('marks actions a middleware handled without passing on', async () => {
    const { ctrl, entries } = mount([
      new StreamManager(),
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ]);
    await act(async () => {
      void ctrl().subscribe(getTicker);
    });
    expect(entries()).toEqual([
      {
        type: actionTypes.SUBSCRIBE,
        origin: undefined,
        consumedBy: 'StreamManager',
      },
    ]);
  });

  it('credits NetworkManager with the fetches it handles and its response', async () => {
    function App() {
      const { price } = useSuspense(getTicker);
      return <div>price {price}</div>;
    }
    const { entries } = mount(
      [new NetworkManager(), new SubscriptionManager(PollingSubscription)],
      <App />,
    );
    await screen.findByText('price 1');
    // suspense renders twice: the second fetch shares the first's request
    const fetched = {
      type: actionTypes.FETCH,
      origin: undefined,
      consumedBy: 'NetworkManager',
    };
    expect(entries()).toEqual([
      fetched,
      fetched,
      {
        type: actionTypes.SET_RESPONSE,
        origin: 'NetworkManager',
        consumedBy: undefined,
      },
    ]);
  });

  it('waits for async middleware before calling an action consumed', async () => {
    const { ctrl, entries } = mount([new SlowManager(), new NetworkManager()]);
    await act(async () => {
      void ctrl().set(Ticker, { id: 'BTC' }, { id: 'BTC', price: 4 });
    });
    expect(entries()).toEqual([
      { type: actionTypes.SET, origin: undefined, consumedBy: undefined },
    ]);
    expect(screen.queryByText('loading')).toBeNull();
  });

  it('credits an action sent while another passes to whoever sent it', async () => {
    // Echo answers each set with an expire, from inside the set's dispatch
    class Echo implements Manager<ActionTypes> {
      middleware: Middleware<ActionTypes> = controller => next => action => {
        if (action.type === actionTypes.SET)
          controller.expireAll({ testKey: () => false });
        return next(action);
      };

      cleanup() {}
    }
    const stream = new StreamManager();
    const { ctrl, entries } = mount([stream, new Echo(), new NetworkManager()]);
    await act(async () => {
      void stream.push(5);
      void ctrl().resetEntireStore();
    });
    expect(entries().map(e => [e.type, e.origin])).toEqual([
      [actionTypes.SET, 'StreamManager'],
      [actionTypes.EXPIREALL, 'Echo'],
      [actionTypes.RESET, undefined],
    ]);
  });
});
