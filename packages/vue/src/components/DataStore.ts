import { createReducer } from '@data-client/core';
import type { State } from '@data-client/core';
import type { Middleware as GenericMiddleware } from '@data-client/use-enhanced-reducer';
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
} from 'vue';

import { ControllerKey, StateKey } from '../context.js';

export interface StoreProps {
  mgrEffect: () => void;
  middlewares: GenericMiddleware[];
  initialState: State<unknown>;
  controller: any; // Controller
}

/**
 * Vue counterpart to React DataStore: owns reducer state and exposes it via provide/inject.
 * Expects props to be referentially stable after mount.
 */
export default defineComponent<StoreProps>({
  name: 'DataStore',
  props: ['mgrEffect', 'middlewares', 'initialState', 'controller'] as any,
  setup(props, { slots }) {
    // Create reducer bound to controller
    const masterReducer = createReducer(props.controller);

    // state ref holds current committed state; updates trigger reactive recompute
    const stateRef = shallowRef<State<unknown>>(props.initialState);

    // Build a redux-like dispatch chain with middlewares using controller.bindMiddleware
    // We emulate the use-enhanced-reducer behavior: dispatch returns a Promise that resolves when committed
    let resolveNext: (() => void) | null = null;
    const waitForCommit = () =>
      new Promise<void>(resolve => {
        resolveNext = resolve;
      });

    const realDispatch = async (action: any) => {
      // compute next state synchronously via reducer
      const next = masterReducer(stateRef.value, action);
      stateRef.value = next;
      // resolve pending promise after state commit microtask
      if (resolveNext) {
        const r = resolveNext;
        resolveNext = null;
        r();
      }
      return Promise.resolve();
    };

    const getState = () => stateRef.value;

    // compose middlewares
    const chain = props.middlewares.map(mw =>
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

    // Bind controller with middleware API
    props.controller.bindMiddleware({
      getState,
      dispatch: (a: any) => outerDispatch(a),
    } as any);

    // provide state and controller
    provide(StateKey, stateRef);
    provide(ControllerKey, props.controller);

    // run managers' init/cleanup after mount via mgrEffect()
    let cleanup: void | (() => void);
    onMounted(() => {
      cleanup = props.mgrEffect();
    });
    onUnmounted(() => {
      if (cleanup) cleanup();
    });

    return () => (slots.default ? slots.default() : h('div'));
  },
});
