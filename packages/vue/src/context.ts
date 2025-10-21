import { initialState, Controller } from '@data-client/core';
import type { State } from '@data-client/core';
import { inject, type InjectionKey, shallowRef, type ShallowRef } from 'vue';

export const StateKey: InjectionKey<ShallowRef<State<unknown>>> = Symbol(
  'DataClientState',
) as any;
export const ControllerKey: InjectionKey<Controller> = Symbol(
  'DataClientController',
) as any;

/** Fallback state ref used when no provider is found. */
export const FallbackStateRef: ShallowRef<State<unknown>> =
  shallowRef(initialState);

export function useController(): Controller {
  const ctrl = inject(ControllerKey, null);
  if (!ctrl) {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        'It appears you are trying to use Reactive Data Client (Vue) without a provider.\n' +
          'Follow instructions: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component',
      );
    }
    return new Controller();
  }
  return ctrl;
}

export function injectState(): ShallowRef<State<unknown>> {
  const state = inject(StateKey, null);
  if (!state) {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        'It appears you are trying to use Reactive Data Client (Vue) without a provider.\n' +
          'Follow instructions: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component',
      );
    }
    return FallbackStateRef;
  }
  return state;
}
