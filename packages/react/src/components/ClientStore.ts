import {
  Controller as DataController,
  applyManager,
  createReducer,
  initialState as defaultState,
} from '@data-client/core';
import type {
  ActionTypes,
  GCInterface,
  Manager,
  State,
} from '@data-client/core';
import { usePromisifiedDispatch } from '@data-client/use-enhanced-reducer';
import { useEffect, useLayoutEffect, useReducer, useRef } from 'react';

import { getDefaultManagers } from './getDefaultManagers.js';
import { SSR } from './LegacyReact.js';
import GCPolicy from '../state/GCPolicy.js';

const CATCH_UP = 'rdc/catchup';

export interface ClientStoreOptions {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: new (props: { gcPolicy: GCInterface }) => DataController;
  gcPolicy?: GCInterface;
}

/** A DataProvider store that lives outside React
 *
 * React discards a render that never commits, along with anything it created.
 * This store owns the Controller and managers, and reduces actions itself until
 * a DataProvider commits, so the provider that commits starts from them.
 *
 * Create it once per client, outside any component, and pass it to `<DataProvider store>`.
 * When rendering on a server, create one per request; a module-level store would be
 * shared by every request.
 * @see https://dataclient.io/docs/api/ClientStore
 */
export default class ClientStore {
  declare readonly controller: DataController;
  declare readonly managers: Manager[];
  declare readonly reducer: (
    state: State<unknown>,
    action: ActionTypes | CatchUpAction,
  ) => State<unknown>;

  // committed providers; the first is the one getState() reads
  protected sinks = new Set<Sink>();
  // reduced here while no provider is committed
  protected state: State<unknown>;
  // a provider rendered against this store but has not committed
  protected rendered = false;
  // keeps those fetches in flight, so a provider that commits later reuses them
  protected waiting: (() => void)[] = [];

  constructor({
    managers = getDefaultManagers(),
    initialState = defaultState as State<unknown>,
    Controller = DataController,
    gcPolicy = new GCPolicy(),
  }: ClientStoreOptions = {}) {
    this.controller = new Controller({ gcPolicy });
    const master = createReducer(this.controller);
    this.reducer = (state, action) =>
      action.type === CATCH_UP ?
        (action as CatchUpAction).state
      : master(state, action as ActionTypes);
    this.state = initialState;
    this.managers = managers;
    // bound once, so renders React discards can't rebind the Controller
    const api = {
      getState: this.getState,
      dispatch: (action: ActionTypes) => dispatch(action),
    };
    const dispatch: (action: ActionTypes) => Promise<void> = applyManager(
      managers,
      this.controller,
    )
      .map(middleware => middleware(api))
      .reduceRight((next: any, middleware) => middleware(next), this.reduce);
  }

  /** State of the first committed DataProvider, or this store's own while none is committed
   *
   * Managers see committed state, as they do without a store.
   */
  getState = (): State<unknown> => {
    for (const sink of this.sinks) return sink.getState();
    return this.state;
  };

  protected reduce = (action: ActionTypes): Promise<void> => {
    if (this.sinks.size)
      return Promise.all(
        Array.from(this.sinks, sink => sink.dispatch(action)),
      ).then(() => {});
    this.state = this.reducer(this.state, action);
    // a server never commits, and nothing renders yet when prefetching
    if (SSR || !this.rendered) return Promise.resolve();
    return new Promise<void>(resolve => this.waiting.push(resolve));
  };

  protected attach(sink: Sink) {
    const latest = this.getState();
    if (!this.sinks.size) {
      this.managers.forEach(manager => manager.init?.(latest));
      this.controller.gcPolicy.init(this.controller);
    }
    this.sinks.add(sink);
    const waiting = this.waiting;
    this.waiting = [];
    // dispatched from a layout effect, so it renders in this commit's sync lane
    // rather than any transition the missed actions were dispatched in
    const caughtUp =
      sink.getState() === latest ?
        Promise.resolve()
      : sink.dispatch({ type: CATCH_UP, state: latest });
    caughtUp.then(() => waiting.forEach(resolve => resolve()));
    return () => {
      this.sinks.delete(sink);
      if (this.sinks.size) return;
      this.state = sink.getState();
      this.managers.forEach(manager => manager.cleanup());
      this.controller.gcPolicy.cleanup();
    };
  }

  /** DataProvider's state; starts from this store and receives its actions once committed */
  useState(): State<unknown> {
    // a hook DataProvider calls; kept on the store so DataProvider doesn't import it
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStoreState(this);
  }
}

function useStoreState(store: ClientStore): State<unknown> {
  store['rendered'] = true;
  const [state, dispatch] = useReducer(
    store.reducer,
    undefined,
    store.getState,
  );
  const dispatchWithPromise = usePromisifiedDispatch(dispatch, state);
  const committed = useRef(state);
  useEffect(() => {
    committed.current = state;
  }, [state]);
  useLayoutEffect(
    () =>
      store['attach']({
        dispatch: dispatchWithPromise,
        getState: () => committed.current,
      }),
    [store, dispatchWithPromise],
  );
  return state;
}

interface Sink {
  dispatch: (action: ActionTypes | CatchUpAction) => Promise<void>;
  getState: () => State<unknown>;
}

interface CatchUpAction {
  type: typeof CATCH_UP;
  state: State<unknown>;
}
