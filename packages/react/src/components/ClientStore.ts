import {
  Controller as DataController,
  createReducer,
  initialState as defaultState,
} from '@data-client/core';
import type {
  ActionTypes,
  GCInterface,
  Manager,
  Middleware,
  State,
} from '@data-client/core';

import { getDefaultManagers } from './getDefaultManagers.js';
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
 * Results that settle in that window still reduce into this store, and the
 * DataProvider that commits starts from them.
 *
 * Create it once, outside any component, and pass it to `<DataProvider store>`.
 * @see https://dataclient.io/docs/api/ClientStore
 */
export default class ClientStore implements Manager {
  declare readonly controller: DataController;
  declare readonly managers: Manager[];
  declare readonly reducer: (
    state: State<unknown>,
    action: ActionTypes | CatchUpAction,
  ) => State<unknown>;

  /** The latest state while no DataProvider is mounted */
  declare state: State<unknown>;
  protected mounted = false;
  // reduced here but not yet in a mounted DataProvider; counts index the state each one produced
  protected pending: ActionTypes[] = [];
  protected counts = new WeakMap<State<unknown>, number>();
  // keeps those fetches in flight, so a render that is shown before mount reuses them
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
        (action as CatchUpAction).actions.reduce(master, state)
      : master(state, action as ActionTypes);
    this.state = initialState;
    this.managers = [...managers, this];
  }

  middleware: Middleware = controller => {
    const getState = controller.getState;
    // before mount, this store is the source of truth
    controller.getState = () => (this.mounted ? getState() : this.state);
    return next => action => {
      if (this.mounted) return next(action);
      this.state = this.reducer(this.state, action);
      this.pending.push(action);
      this.counts.set(this.state, this.pending.length);
      return new Promise<void>(resolve => this.waiting.push(resolve));
    };
  };

  /** Called with the state the mounted DataProvider started from */
  init(seed: State<unknown>) {
    const tail = this.pending.slice(this.counts.get(seed) ?? 0);
    const waiting = this.waiting;
    this.pending = [];
    this.waiting = [];
    this.counts = new WeakMap();
    this.mounted = true;
    // settled after that DataProvider rendered, but before it mounted
    const caughtUp =
      tail.length ?
        this.controller.dispatch({ type: CATCH_UP, actions: tail } as any)
      : Promise.resolve();
    caughtUp.then(() => waiting.forEach(resolve => resolve()));
  }

  cleanup() {
    this.state = this.controller.getState();
    this.mounted = false;
  }
}

interface CatchUpAction {
  type: typeof CATCH_UP;
  actions: ActionTypes[];
}
