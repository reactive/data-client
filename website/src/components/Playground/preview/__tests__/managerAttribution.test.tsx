/// <reference types="jest" />
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  actionTypes,
  DataProvider,
  DevToolsManager,
  IdlingNetworkManager,
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
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React, { Suspense } from 'react';

import { declarationsOf } from '../../editor/declarations';
import { CodeOpenerContext, type CodeOpener } from '../../editor/openCode';
import { stageFilter } from '../store/actionGroups';
import type { LogEntry } from '../store/actionLog';
import {
  managerStages,
  pipeline,
  routesOf,
  stageName,
  type ManagerStage,
} from '../store/attribution';
import SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';

jest.mock('../../../../utils/tabStorage', () => ({
  useTabStorage: () => require('react').useState(null),
}));

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

/** Fetches with `controller.fetch`, passing everything on */
class PrefetchManager implements Manager<ActionTypes> {
  declare controller: Controller;
  middleware: Middleware<ActionTypes> = controller => {
    this.controller = controller;
    return next => action => next(action);
  };

  prefetch() {
    return this.controller.fetch(getTicker);
  }

  cleanup() {}
}

/** Passes everything on */
class QuietManager implements Manager<ActionTypes> {
  middleware: Middleware<ActionTypes> = () => next => action => next(action);

  cleanup() {}
}

const getTicker = new Endpoint(async () => ({ id: 'BTC', price: 1 }), {
  schema: Ticker,
  key: () => 'GET /ticker',
  name: 'getTicker',
});

/** A manager of a class of the code's that shares the library's name */
function codeNetworkManager(): Manager {
  class NetworkManager {
    middleware = () => (next: unknown) => next;
    cleanup() {}
  }
  return new NetworkManager() as any;
}

function codeNetworkManagerStage() {
  return managerStages([codeNetworkManager()])[0];
}

/** A store of `own` managers that logs to `registry`'s history 0, as the
 * playground's does */
function connectStore(
  registry: SchemaRegistry,
  own: Manager[],
  children: React.ReactNode = null,
) {
  const log = registry.log.connect(0);
  const ref: { ctrl?: Controller } = {};
  function Grab() {
    ref.ctrl = useController();
    return null;
  }
  const view = render(
    <DataProvider
      managers={[log.head, registry, ...log.track(own), log.tail]}
      devButton={null}
    >
      <Grab />
      {children}
    </DataProvider>,
  );
  return { view, ctrl: () => ref.ctrl! };
}

function mount(
  own: Manager[],
  preview?: React.ReactNode,
  panel = false,
  opener: CodeOpener | null = null,
) {
  const registry = new SchemaRegistry({ trimEvery: 1 });
  const { ctrl } = connectStore(
    registry,
    own,
    <CodeOpenerContext.Provider value={opener}>
      <Suspense fallback="loading">{preview}</Suspense>
      {panel && <StorePanel registry={registry} history={0} />}
    </CodeOpenerContext.Provider>,
  );
  return {
    ctrl,
    history: () => registry.log.history(0),
    entries: () =>
      registry.log.history(0).entries.map(e => ({
        type: e.action.type,
        origin: e.origin && stageName(e.origin),
        consumedBy: e.consumedBy && stageName(e.consumedBy),
        requested: e.requested,
      })),
  };
}

/** A fetch the log recorded, sent and handled as given */
const fetchEntry = (
  seq: number,
  origin?: ManagerStage,
  consumedBy?: ManagerStage,
): LogEntry => ({
  seq,
  at: seq,
  action: { type: actionTypes.FETCH } as ActionTypes,
  origin,
  consumedBy,
});

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
      {
        id: 'code:StreamManager#1',
        className: 'StreamManager',
        n: 1,
        library: false,
      },
      {
        id: 'code:StreamManager#2',
        className: 'StreamManager',
        n: 2,
        library: false,
      },
      {
        id: 'lib:NetworkManager#1',
        className: 'NetworkManager',
        n: 1,
        library: true,
      },
      {
        id: 'lib:SubscriptionManager#1',
        className: 'SubscriptionManager',
        n: 1,
        library: true,
      },
    ]);
    expect(history().managers!.map(stageName)).toEqual([
      'StreamManager',
      'StreamManager #2',
      'NetworkManager',
      'SubscriptionManager',
    ]);
  });

  it('records the stage of each action it credits', async () => {
    const stream = new StreamManager();
    const { history } = mount([stream, new NetworkManager()]);
    await act(async () => {
      void stream.push(2);
    });
    // the same stage the history's chain holds
    expect(history().entries[0].origin).toBe(history().managers![0]);
  });

  it('knows library managers by class, not by their (minified) name', () => {
    const name = Object.getOwnPropertyDescriptor(NetworkManager, 'name')!;
    Object.defineProperty(NetworkManager, 'name', { value: 'e' });
    try {
      expect(
        managerStages([
          new NetworkManager(),
          { middleware: () => (n: unknown) => n } as any,
        ]),
      ).toEqual([
        {
          id: 'lib:NetworkManager#1',
          className: 'NetworkManager',
          n: 1,
          library: true,
        },
        { id: 'code:Object#1', className: 'Object', n: 1, library: false },
      ]);
    } finally {
      Object.defineProperty(NetworkManager, 'name', name);
    }
  });

  it("names a subclass of the library's for itself: it is the code's", () => {
    class PollingNetwork extends NetworkManager {}
    const [own, idling] = managerStages([
      new PollingNetwork(),
      new IdlingNetworkManager(),
    ]);
    expect(own).toEqual({
      id: 'code:PollingNetwork#1',
      className: 'PollingNetwork',
      n: 1,
      library: false,
    });
    // the library's own subclass is the library's
    expect(idling.library).toBe(true);
  });

  it('gives the same place in every chain the same stage', () => {
    const [a, , network] = managerStages([
      new StreamManager(),
      new StreamManager(),
      new NetworkManager(),
    ]);
    const [b, second] = managerStages([
      new StreamManager(),
      new StreamManager(),
    ]);
    // a store restored or remade from the same code has the same stages
    expect(b.id).toBe(a.id);
    expect(second.id).not.toBe(a.id);
    expect(managerStages([new NetworkManager()])[0].id).toBe(network.id);
  });

  it("doesn't take a class of the code's for the library's by its name", () => {
    expect(codeNetworkManagerStage()).toEqual({
      id: 'code:NetworkManager#1',
      className: 'NetworkManager',
      n: 1,
      library: false,
    });
  });

  it("ids a code class apart from the library's of its name, and names it apart", () => {
    // counted together, the library's would be #2 here and #1 without it
    const stages = managerStages([codeNetworkManager(), new NetworkManager()]);
    expect(stages.map(stage => stage.id)).toEqual([
      'code:NetworkManager#1',
      'lib:NetworkManager#1',
    ]);
    // while each still reads apart in the inspector
    expect(stages.map(stageName)).toEqual([
      'NetworkManager',
      'NetworkManager #2',
    ]);
  });

  it("keeps a code class's routes apart from the library's of its name", () => {
    const own = codeNetworkManagerStage();
    const [library] = managerStages([new NetworkManager()]);
    expect(
      routesOf([
        fetchEntry(1, own),
        fetchEntry(2, library),
        fetchEntry(3, own),
      ]).map(({ entry, n }) => ({ seq: entry.seq, n })),
    ).toEqual([
      { seq: 1, n: 2 },
      { seq: 2, n: 1 },
    ]);
  });

  it('names the managers of a store that took over a history before it acted', async () => {
    const registry = new SchemaRegistry({ trimEvery: 1 });
    /** Sets a ticker as it mounts: before the managers' init, which runs
     * in DataProvider's effect, after its children's */
    function SetsOnMount() {
      const ctrl = useController();
      React.useEffect(() => {
        void ctrl.set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
      }, [ctrl]);
      return null;
    }
    // the defaults start the history, with no action yet (the code's
    // getManagers() registers after the first store mounts)
    connectStore(registry, [new NetworkManager()]).view.unmount();
    await act(async () => {
      connectStore(
        registry,
        [new StreamManager(), new NetworkManager()],
        <SetsOnMount />,
      );
    });
    expect(registry.log.history(0).managers?.map(stageName)).toEqual([
      'StreamManager',
      'NetworkManager',
    ]);
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
      requested: true,
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

  it("knows a NetworkManager subclass's fetches start requests", async () => {
    class LoggingNetworkManager extends NetworkManager {}
    function App() {
      const { price } = useSuspense(getTicker);
      return <div>price {price}</div>;
    }
    const { entries } = mount([new LoggingNetworkManager()], <App />);
    await screen.findByText('price 1');
    expect(entries()[0]).toEqual({
      type: actionTypes.FETCH,
      origin: undefined,
      consumedBy: 'LoggingNetworkManager',
      requested: true,
    });
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

  it('counts a copy passed on as the action passed on', async () => {
    class Stamping implements Manager<ActionTypes> {
      middleware: Middleware<ActionTypes> = () => next => action =>
        next({ ...action });

      cleanup() {}
    }
    const { ctrl, entries } = mount([new Stamping(), new NetworkManager()]);
    await act(async () => {
      void ctrl().set(Ticker, { id: 'BTC' }, { id: 'BTC', price: 6 });
    });
    expect(entries()[0].consumedBy).toBeUndefined();
  });

  it('credits whoever handles a copy, and stores it, on the recorded action', async () => {
    class Stamping implements Manager<ActionTypes> {
      middleware: Middleware<ActionTypes> = () => next => action =>
        next({ ...action });

      cleanup() {}
    }
    const { ctrl, history } = mount([
      new Stamping(),
      new Stamping(),
      new StreamManager(),
      new NetworkManager(),
    ]);
    await act(async () => {
      void ctrl().subscribe(getTicker);
      void ctrl().set(Ticker, { id: 'BTC' }, { id: 'BTC', price: 6 });
    });
    const [subscribe, set] = history().entries;
    expect(subscribe.consumedBy?.className).toBe('StreamManager');
    expect(set.store).toBeDefined();
  });

  it("keeps an action's own record when another is passed on besides it", async () => {
    class Extra implements Manager<ActionTypes> {
      middleware: Middleware<ActionTypes> = controller => next => action => {
        const result = next(action);
        if (action.type === actionTypes.SET)
          next({ ...action, value: { id: 'BTC', price: 0 } } as ActionTypes);
        return result;
      };

      cleanup() {}
    }
    const { ctrl, history } = mount([new Extra(), new NetworkManager()]);
    await act(async () => {
      void ctrl().set(Ticker, { id: 'BTC' }, { id: 'BTC', price: 9 });
    });
    const [set] = history().entries;
    expect(set.store?.before).not.toBe(set.store?.after);
    expect((set.store?.after.entities as any).Ticker.BTC.price).toBe(9);
  });

  it('takes back "handled" when a held action is passed on later', async () => {
    jest.useFakeTimers();
    try {
      class Holding implements Manager<ActionTypes> {
        middleware: Middleware<ActionTypes> = () => next => action => {
          setTimeout(() => next(action), 100);
          return undefined as any;
        };

        cleanup() {}
      }
      const { ctrl, entries } = mount([new Holding(), new NetworkManager()]);
      act(() => {
        void ctrl().set(Ticker, { id: 'BTC' }, { id: 'BTC', price: 7 });
      });
      expect(entries()[0].consumedBy).toBe('Holding');
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(entries()[0].consumedBy).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("doesn't credit DevToolsManager with calls through the controller it shares", async () => {
    const devtools = new DevToolsManager();
    const { entries } = mount([devtools, new NetworkManager()]);
    await act(async () => {
      void (devtools as any).controller.set(
        Ticker,
        { id: 'BTC' },
        { id: 'BTC', price: 8 },
      );
    });
    expect(entries()[0].origin).toBeUndefined();
  });

  it('wraps each manager once, guarding those it reports for', () => {
    const log = new SchemaRegistry().log.connect(0);
    const error = new Error('broke');
    const thrower: Manager = {
      middleware: () => () => () => {
        throw error;
      },
      cleanup() {},
    };
    const network = new NetworkManager();
    const report = jest.fn();
    const [guarded, tracked] = log.track([thrower, network], manager =>
      manager === thrower ? report : undefined,
    );
    expect(Object.getPrototypeOf(guarded)).toBe(thrower);
    expect(Object.getPrototypeOf(tracked)).toBe(network);

    // the failed step is skipped: the action goes on to the next middleware
    const next = jest.fn();
    const action = { type: actionTypes.GC } as ActionTypes;
    guarded.middleware({} as Controller)(next)(action);
    expect(report).toHaveBeenCalledWith(error);
    expect(next).toHaveBeenCalledWith(action);
  });

  /** `manager`, tracked and guarded, with where it reports */
  const guard = (manager: unknown) => {
    const report = jest.fn();
    const [guarded] = new SchemaRegistry().log
      .connect(0)
      .track([manager as Manager], () => report);
    return { guarded, report };
  };

  it("leaves what comes after a manager whose middleware won't build unguarded", async () => {
    const { guarded, report } = guard({ cleanup() {} });
    const failed = new Error('request failed');
    const dispatch = guarded.middleware({} as Controller)(() =>
      Promise.reject(failed),
    );
    expect(report.mock.calls[0][0].message).toMatch(/has no middleware/);
    // the store's own failure reaches the caller, not the manager error
    await expect(
      dispatch({ type: actionTypes.GC } as ActionTypes),
    ).rejects.toBe(failed);
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('reports a middleware that returns no function', () => {
    const { guarded, report } = guard({
      middleware: () => undefined,
      cleanup() {},
    });
    const next = jest.fn();
    const action = { type: actionTypes.GC } as ActionTypes;
    guarded.middleware({} as Controller)(next)(action);
    expect(report.mock.calls[0][0].message).toMatch(/returned no function/);
    expect(report).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('reports a step that returns no function', () => {
    const { guarded, report } = guard({
      middleware: () => () => undefined,
      cleanup() {},
    });
    const next = jest.fn();
    const dispatch = guarded.middleware({} as Controller)(next);
    const action = { type: actionTypes.GC } as ActionTypes;
    dispatch(action);
    dispatch(action);
    expect(report.mock.calls[0][0].message).toMatch(/must return action =>/);
    expect(report).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('guards a middleware that passes next itself, passing an action on once when its step throws', () => {
    const { guarded, report } = guard({
      middleware: () => (next: unknown) => next,
      cleanup() {},
    });
    const error = new Error('later');
    const action = { type: actionTypes.GC } as ActionTypes;
    const next = jest.fn(() => {
      throw error;
    });
    guarded.middleware({} as Controller)(next)(action);
    expect(report).toHaveBeenCalledWith(error);
    // passed on once, not again as the step fails
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('stageFilter', () => {
  const base = {
    hit: (e: any) => !!e.store,
    lists: () => true,
    gaps: new Map(),
  };
  const [stream, network] = managerStages([
    new StreamManager(),
    new NetworkManager(),
  ]);

  it("lists all the store's actions, and stands on those the code's managers kept too", () => {
    const filter = stageFilter(base, [stream, network], null);
    expect(filter.lists).toBe(base.lists);
    expect(filter.hit({ consumedBy: stream } as any)).toBe(true);
    expect(filter.hit({ consumedBy: network } as any)).toBe(false);
    // one the code no longer has isn't the code's managers' work
    expect(
      stageFilter(base, [network], null).hit({ consumedBy: stream } as any),
    ).toBe(false);
  });

  it("narrows to a picked stage's actions", () => {
    const filter = stageFilter(base, [stream, network], stream);
    expect(filter.lists({ origin: stream } as any)).toBe(true);
    expect(filter.lists({ store: {} } as any)).toBe(false);
  });

  it('matches stages of a copied history (as devtools would get it)', () => {
    const [copied] = structuredClone([stream]);
    expect(copied).not.toBe(stream);
    const picked = stageFilter(base, [stream, network], copied);
    expect(picked.lists({ origin: stream } as any)).toBe(true);
    expect(
      stageFilter(base, [stream, network], null).hit({
        consumedBy: copied,
      } as any),
    ).toBe(true);
  });

  it('counts and routes the stages of a copied history as its own', () => {
    const entries = [
      fetchEntry(1, stream, network),
      fetchEntry(2, stream, network),
    ];
    const copied = structuredClone(entries);
    expect(pipeline([stream, network], copied)).toEqual(
      pipeline([stream, network], entries),
    );
    expect(routesOf([...entries, ...copied]).map(({ n }) => n)).toEqual([4]);
  });
});

describe('Store panel pipeline', () => {
  const openActions = () =>
    fireEvent.click(
      within(screen.getAllByRole('group', { name: /^Scrubber/ })[0]).getByRole(
        'button',
        { name: 'Actions' },
      ),
    );
  const pipeline = () => screen.getByRole('group', { name: /^Pipeline/ });
  /** The pipeline's stages (and folds), as they read */
  const stages = () =>
    within(pipeline())
      .getAllByRole('button')
      .map(b => b.textContent);
  /** The pipeline's button that reads `name` */
  const stage = (name: string | RegExp) =>
    within(pipeline()).getByRole('button', { name });
  /** The listed rows' heads */
  const listed = () =>
    screen
      .getByRole('region', { name: 'Actions' })
      .querySelectorAll('[role="button"][aria-expanded]');

  it('draws the app, the chain and the store, with what each sent and kept', async () => {
    const stream = new StreamManager();
    const { ctrl } = mount(
      [
        stream,
        new NetworkManager(),
        new SubscriptionManager(PollingSubscription),
      ],
      undefined,
      true,
    );
    await act(async () => {
      void stream.push(1);
      void stream.push(2);
      void ctrl().subscribe(getTicker);
    });
    openActions();
    expect(stages()).toEqual(['the app1', 'StreamManager2⊘ 1', '2 idle']);
    expect(pipeline().lastElementChild?.textContent).toBe('store');
    // the idle ones open in place, and fold again
    fireEvent.click(stage(/^2 idle/));
    expect(stages()).toEqual([
      'the app1',
      'StreamManager2⊘ 1',
      'NetworkManager0',
      'SubscriptionManager0',
      'fold',
    ]);
    fireEvent.click(stage(/^fold/));
    stage(/^2 idle/);
  });

  it('draws the library defaults and their path', async () => {
    const { ctrl } = mount(
      [new NetworkManager(), new SubscriptionManager(PollingSubscription)],
      undefined,
      true,
    );
    await act(async () => {
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    openActions();
    expect(stages()).toEqual(['the app1', '2 idle']);
    fireEvent.click(listed()[0]);
    const path = await screen.findByRole('group', { name: /^Path/ });
    // it only passed them
    expect(path.textContent).toBe('the app→2 passed→store');
  });

  it('folds each run of quiet managers on its own', async () => {
    const { ctrl } = mount(
      [
        new QuietManager(),
        new QuietManager(),
        new StreamManager(),
        new NetworkManager(),
        new SubscriptionManager(PollingSubscription),
      ],
      undefined,
      true,
    );
    await act(async () => {
      void ctrl().subscribe(getTicker);
    });
    openActions();
    expect(stages()).toEqual([
      'the app1',
      '2 idle',
      'StreamManager0⊘ 1',
      '2 idle',
    ]);
    const [first] = within(pipeline()).getAllByRole('button', {
      name: /^2 idle/,
    });
    expect(first.getAttribute('aria-expanded')).toBe('false');
    first.focus();
    fireEvent.click(first);
    expect(stages()).toEqual([
      'the app1',
      'QuietManager0',
      'QuietManager #20',
      'fold',
      'StreamManager0⊘ 1',
      '2 idle',
    ]);
    // it says which run it folds
    const fold = stage('fold: QuietManager, QuietManager #2');
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    // the button pressed stays, keeping focus, to fold it back
    expect(fold).toBe(first);
    expect(document.activeElement).toBe(fold);
    fireEvent.click(fold);
    expect(document.activeElement?.textContent).toBe('2 idle');
    expect(stages()).toEqual([
      'the app1',
      '2 idle',
      'StreamManager0⊘ 1',
      '2 idle',
    ]);
    fireEvent.click(listed()[0]);
    const path = await screen.findByRole('group', { name: /^Path/ });
    expect(path.textContent).toBe(
      'the app→2 passed→StreamManager⊘ handled it→2 never saw it→store',
    );
  });

  it('keeps a run open as its first manager leaves, and folded when it rejoins', async () => {
    const { ctrl } = mount(
      [new QuietManager(), new QuietManager(), new QuietManager()],
      undefined,
      true,
    );
    await act(async () => {
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    openActions();
    expect(stages()).toEqual(['the app1', '3 idle']);
    fireEvent.click(stage(/^3 idle/));
    // picking the first takes it out of the run, which stays open
    fireEvent.click(stage(/^QuietManager(?! #)/));
    expect(stages()).toEqual([
      'the app1',
      'QuietManager0',
      'QuietManager #20',
      'QuietManager #30',
      'fold',
    ]);
    fireEvent.click(stage(/^fold/));
    expect(stages()).toEqual(['the app1', 'QuietManager0', '2 idle']);
    // unpicked, it rejoins the folded run without opening it
    fireEvent.click(stage(/^QuietManager(?! #)/));
    expect(stages()).toEqual(['the app1', '3 idle']);
  });

  it('closes a run that splits up', async () => {
    const { ctrl } = mount(
      [new QuietManager(), new QuietManager()],
      undefined,
      true,
    );
    await act(async () => {
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    openActions();
    fireEvent.click(stage(/^2 idle/));
    fireEvent.click(stage(/^QuietManager(?! #)/));
    expect(stages()).toEqual(['the app1', 'QuietManager0', 'QuietManager #20']);
    fireEvent.click(stage(/^QuietManager(?! #)/));
    expect(stages()).toEqual(['the app1', '2 idle']);
  });

  it("shows only a stage's actions while it is picked", async () => {
    const stream = new StreamManager();
    const { ctrl } = mount([stream, new NetworkManager()], undefined, true);
    await act(async () => {
      void stream.push(1);
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
      void ctrl().subscribe(getTicker);
    });
    openActions();
    expect(listed()).toHaveLength(3);
    const streamStage = stage(/^StreamManager/);
    fireEvent.click(streamStage);
    expect(streamStage.getAttribute('aria-pressed')).toBe('true');
    // its set and the subscribe it kept from the store
    expect(listed()).toHaveLength(2);
    fireEvent.click(stage(/^the app/));
    expect(listed()).toHaveLength(2);
    fireEvent.click(stage(/^the app/));
    expect(listed()).toHaveLength(3);
  });

  it('keeps a picked stage when the code remakes its managers', async () => {
    const registry = new SchemaRegistry({ trimEvery: 1 });
    render(<StorePanel registry={registry} history={0} />);
    const store = (stream: StreamManager) =>
      connectStore(registry, [stream, new NetworkManager()]);
    const first = new StreamManager();
    const { view } = store(first);
    await act(async () => {
      void first.push(1);
    });
    openActions();
    fireEvent.click(stage(/^StreamManager/));
    view.unmount();
    // the same code, remade: new managers, new stage objects, same places
    const second = new StreamManager();
    const remade = store(second);
    await act(async () => {
      void second.push(2);
      void remade.ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    expect(stage(/^StreamManager/).getAttribute('aria-pressed')).toBe('true');
  });

  it("steps and marks only the picked stage's actions, until the State tab", async () => {
    const stream = new StreamManager();
    const { ctrl } = mount([stream, new NetworkManager()], undefined, true);
    await act(async () => {
      void stream.push(1);
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
      void stream.push(2);
    });
    const marks = () =>
      within(screen.getAllByRole('group', { name: /^Scrubber/ })[0])
        .getAllByRole('button', { name: /^set at/ })
        .map(m => [!!m.dataset.dim, !!m.dataset.selected]);
    openActions();
    fireEvent.click(stage(/^StreamManager/));
    // the app's set is dim on the timeline
    expect(marks().map(([dim]) => dim)).toEqual([false, true, false]);
    // and the steps go past it
    const previous = screen.getByRole('button', { name: 'Previous change' });
    fireEvent.click(previous);
    expect(marks().map(([, selected]) => selected)).toEqual([
      false,
      false,
      true,
    ]);
    fireEvent.click(previous);
    expect(marks().map(([, selected]) => selected)).toEqual([
      true,
      false,
      false,
    ]);
    // leaving the Action tab lets the pick go
    fireEvent.click(screen.getByRole('tab', { name: 'State' }));
    expect(marks().map(([dim]) => dim)).toEqual([false, false, false]);
    fireEvent.click(screen.getByRole('tab', { name: 'Action' }));
    expect(stage(/^StreamManager/).getAttribute('aria-pressed')).toBe('false');
  });

  it("shows the picked stage's newest action live", async () => {
    const stream = new StreamManager();
    const { ctrl } = mount([stream, new NetworkManager()], undefined, true);
    await act(async () => {
      void stream.push(1);
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    const top = () =>
      [...document.querySelectorAll<HTMLElement>('[data-level]')].find(
        el => !el.closest('[hidden]') && !el.hasAttribute('data-covered'),
      )!;
    openActions();
    fireEvent.click(stage(/^StreamManager/));
    fireEvent.click(listed()[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Live' }));
    // the newest the steps go through: StreamManager's, not the app's
    expect(top().textContent).toContain('↑ sent it');
  });

  it("tags the store's actions with the manager that sent them", async () => {
    const stream = new StreamManager();
    const { ctrl } = mount([stream, new NetworkManager()], undefined, true);
    await act(async () => {
      void stream.push(1);
      void ctrl().set(Ticker, { id: 'ETH' }, { id: 'ETH', price: 3 });
    });
    openActions();
    expect(screen.getAllByText('↑ StreamManager')).toHaveLength(1);
  });

  it("draws a request's paths: one for each way its actions took", async () => {
    const { ctrl } = mount([new NetworkManager()], undefined, true);
    await act(async () => {
      await Promise.all([ctrl().fetch(getTicker), ctrl().fetch(getTicker)]);
    });
    openActions();
    fireEvent.click(listed()[0]);
    const paths = await screen.findAllByRole('group', { name: /^Path/ });
    expect(paths.map(p => p.textContent)).toEqual([
      'the app→NetworkManager⊘ handled it→store×2',
      // a manager's dispatch starts at the top of the chain
      'NetworkManager↑ sent it→store',
    ]);
    // each under the first step to take it; the deduped fetch took the
    // same way
    const fetchPath = paths[0].parentElement;
    expect(fetchPath?.previousElementSibling?.textContent).toMatch(
      /^\d+\.\d+sfetch$/,
    );
    expect(paths[0].textContent).toMatch(/store×2$/);
    expect(paths[1].parentElement?.previousElementSibling?.textContent).toMatch(
      /^\d+\.\d+ssetResponse/,
    );
  });

  it('heads a request with its steps, then its store changes', async () => {
    const { ctrl } = mount([new NetworkManager()], undefined, true);
    await act(async () => {
      await ctrl().fetch(getTicker);
    });
    openActions();
    fireEvent.click(listed()[0]);
    await screen.findAllByRole('group', { name: /^Path/ });
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent),
    ).toEqual(['Steps', 'Store changes']);
  });

  it('draws the path of a deduped fetch that went its own way', async () => {
    const prefetcher = new PrefetchManager();
    const { ctrl } = mount([prefetcher, new NetworkManager()], undefined, true);
    await act(async () => {
      await Promise.all([ctrl().fetch(getTicker), prefetcher.prefetch()]);
    });
    openActions();
    fireEvent.click(listed()[0]);
    const paths = await screen.findAllByRole('group', { name: /^Path/ });
    const own = paths.find(p =>
      /^PrefetchManager↑ sent it/.test(p.textContent ?? ''),
    );
    expect(own?.parentElement?.previousElementSibling?.textContent).toMatch(
      /deduped into this request$/,
    );
  });

  it("opens the code of the playground's own managers wherever they're named", async () => {
    const open = jest.fn();
    const documents = [
      { path: 'Ticker.ts', value: 'export class Ticker {}' },
      {
        path: 'StreamManager.ts',
        value: "import x from 'x';\n\nexport default class StreamManager {}",
      },
    ];
    const stream = new StreamManager();
    mount([stream, new NetworkManager()], undefined, true, {
      declared: declarationsOf(documents),
      open,
    });
    await act(async () => {
      void stream.push(1);
    });
    openActions();
    const target = { path: 'StreamManager.ts', line: 3 };
    const links = () => screen.getAllByTitle('Open StreamManager in the code');
    // the pipeline's, and the tag on its action's row
    expect(links()).toHaveLength(2);
    for (const link of links()) fireEvent.click(link);
    expect(open.mock.calls).toEqual([[target], [target]]);
    // the tag's click opens no action
    expect(screen.queryByRole('group', { name: /^Path/ })).toBeNull();
    // nor do the library's managers, which the code doesn't declare
    expect(screen.queryByTitle(/Open NetworkManager/)).toBeNull();
    fireEvent.click(listed()[0]);
    const path = await screen.findByRole('group', { name: /^Path/ });
    fireEvent.click(within(path).getByTitle('Open StreamManager in the code'));
    expect(open).toHaveBeenLastCalledWith(target);
  });

  it("draws an action's path: who sent it and where it stopped", async () => {
    const { ctrl } = mount(
      [new StreamManager(), new NetworkManager()],
      undefined,
      true,
    );
    await act(async () => {
      void ctrl().subscribe(getTicker);
    });
    openActions();
    fireEvent.click(listed()[0]);
    const path = await screen.findByRole('group', { name: /^Path/ });
    expect(path.textContent).toBe(
      'the app→StreamManager⊘ handled it→NetworkManager→store',
    );
  });
});
