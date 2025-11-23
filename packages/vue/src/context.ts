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
        'Reactive Data Client (Vue) composables dependency injection failed. Either you are missing the DataClientPlugin or you are using composables outside of script setup.\n' +
          'Adding DataClientPlugin: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component\n' +
          'Comosables only work in script setup: https://vuejs.org/guide/reusability/composables.html#usage-restrictions',
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
        'Reactive Data Client (Vue) composables dependency injection failed. Either you are missing the DataClientPlugin or you are using composables outside of script setup.\n' +
          'Adding DataClientPlugin: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component\n' +
          'Comosables only work in script setup: https://vuejs.org/guide/reusability/composables.html#usage-restrictions',
      );
    }
    return FallbackStateRef;
  }
  return state;
}
