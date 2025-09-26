import {
  initialState as defaultState,
  Controller as DataController,
  applyManager,
  initManager,
  createReducer,
} from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import {
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  type ShallowRef,
} from 'vue';

import { ControllerKey, StateKey } from '../context.js';
import { getDefaultManagers } from './getDefaultManagers.js';

export interface ProvideOptions {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  gcPolicy?: GCInterface;
}

export interface ProvidedDataClient {
  controller: InstanceType<typeof DataController>;
  /** Optimistic overlay state ref provided to consumers */
  stateRef: ShallowRef<State<unknown>>;
}

/**
 * Provide/inject setup for @data-client/vue. Call inside setup() of your root component.
 * Mirrors React DataProvider but as a composable.
 */
export function provideDataClient(
  options: ProvideOptions = {},
): ProvidedDataClient {
  const { Controller = DataController, gcPolicy } = options;

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

  // provide to children
  provide(StateKey, stateRef);
  provide(ControllerKey, controller as any);

  // run managers after mount and cleanup on unmount
  let cleanup: void | (() => void);
  onMounted(() => {
    cleanup = mgrEffect();
  });
  onUnmounted(() => {
    if (cleanup) cleanup();
  });

  return { controller: controller as any, stateRef };

  function computeOptimistic(state: State<unknown>): State<unknown> {
    // mirror React’s optimistic overlay
    // reduce over pending optimistic actions to derive the effective state
    // reducer is stable from closure
    return state.optimistic.reduce(reducer as any, state);
  }
}

export default provideDataClient;
