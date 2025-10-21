import {
  initialState as defaultState,
  Controller as DataController,
  applyManager,
  initManager,
  createReducer,
} from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import { provide, shallowRef, type ShallowRef, type App } from 'vue';

import { ControllerKey, StateKey } from '../context.js';
import { getDefaultManagers } from './getDefaultManagers.js';

export interface ProvideOptions {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  gcPolicy?: GCInterface;
  app?: App;
}

export interface ProvidedDataClient {
  controller: InstanceType<typeof DataController>;
  /** Optimistic overlay state ref provided to consumers */
  stateRef: ShallowRef<State<unknown>>;
  /** Start the provider (called on mount) */
  start: () => void;
  /** Stop the provider (called on unmount) */
  stop: () => void;
}

/**
 * Core provider logic that can be used by both composable and plugin.
 * This function handles the actual setup of the data client without Vue-specific concerns.
 */
export function createDataClient(
  options: ProvideOptions = {},
): ProvidedDataClient {
  const { Controller = DataController, gcPolicy, app } = options;

  // stable singletons for this provider scope
  const controller = new Controller({ gcPolicy });
  const managers = options.managers ?? getDefaultManagers();
  const baseInitial = options.initialState ?? (defaultState as State<unknown>);

  // init managers (run on mount/unmount)
  const mgrEffect = initManager(managers, controller, baseInitial);

  // build middlewares and bind to controller
  const middlewares = applyManager(managers, controller);

  // reducer and state management
  const reducer = createReducer(controller);

  // base state (no optimistic overlay) exposed to controller.getState via middleware API
  const baseStateRef = shallowRef<State<unknown>>(baseInitial);
  // optimistic/effective state provided to consumers
  const stateRef = shallowRef<State<unknown>>(computeOptimistic(baseInitial));

  type Dispatch = (action: any) => Promise<void>;

  let resolveNext: (() => void) | null = null;
  const waitForCommit = () =>
    new Promise<void>(resolve => {
      resolveNext = resolve;
    });

  const realDispatch: Dispatch = async action => {
    const nextBase = reducer(baseStateRef.value, action);
    baseStateRef.value = nextBase;
    stateRef.value = computeOptimistic(nextBase);
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r();
    }
  };

  const getState = () => baseStateRef.value;

  // compose middlewares similar to redux
  const chain = middlewares.map(mw =>
    mw({
      getState,
      dispatch: (a: any) => outerDispatch(a),
    } as any),
  );
  const compose = (fns: ((arg: any) => any)[]) => (initial: any) =>
    fns.reduceRight((v, f) => f(v), initial);
  const outerDispatch = compose(chain)(async (action: any) => {
    const promise = waitForCommit();
    await realDispatch(action);
    return promise;
  });

  // wire controller
  controller.bindMiddleware({
    getState,
    dispatch: (a: any) => outerDispatch(a),
  } as any);

  // setup lifecycle management
  let cleanup: void | (() => void);
  const start = () => {
    cleanup = mgrEffect();
  };
  const stop = () => {
    if (cleanup) cleanup();
  };

  // provide to children using Vue's provide or app.provide
  if (app) {
    // Plugin mode: use app.provide
    app.provide(StateKey, stateRef);
    app.provide(ControllerKey, controller as any);
  } else {
    // Composable mode: use provide (must be called within setup)
    provide(StateKey, stateRef);
    provide(ControllerKey, controller as any);
  }

  return {
    controller: controller as any,
    stateRef,
    start,
    stop,
  };

  function computeOptimistic(state: State<unknown>): State<unknown> {
    // mirror React's optimistic overlay
    // reduce over pending optimistic actions to derive the effective state
    // reducer is stable from closure
    return state.optimistic.reduce(reducer as any, state);
  }
}
