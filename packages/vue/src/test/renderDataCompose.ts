import { type Controller } from '@data-client/core';
import { type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, ref, watch, reactive } from 'vue';

import {
  mountDataClient,
  type RenderDataClientOptions,
} from './mountDataClient.js';

/**
 * Renders a Vue composable with DataClient provider for testing
 * Similar to renderDataHook from @data-client/test but for Vue composables
 *
 * @param composable - The composable function to test
 * @param options - Configuration including optional reactive props ref, fixtures, managers, etc.
 */
export function renderDataCompose<P = any, R = any>(
  composable: (props: P) => R,
  options: RenderDataClientOptions<P> = {},
): {
  result: { current: R | undefined };
  wrapper: VueWrapper<any>;
  controller: Controller;
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]>;
  waitForNextUpdate: () => Promise<void>;
} {
  // Extract props from options, or create empty ref if not provided
  const props = options.props || reactive({});

  let resultRef: any;
  let resolveNextUpdate: (() => void) | null = null;

  const TestComponent = defineComponent({
    name: 'TestComposableComponent',
    props: {
      composableProps: {
        type: Object,
        required: true,
      },
    },
    setup(componentProps, { expose }) {
      // Create the result ref inside the component
      resultRef = ref<R | undefined>(undefined);

      // Call the composable once with reactive props - Vue's useSuspense will handle the async behavior
      const composableValue = composable(componentProps.composableProps as P);

      // If composable returns a Promise, we're suspended - keep result as undefined initially
      if (composableValue instanceof Promise) {
        resultRef.value = undefined;

        // Wait for the Promise to resolve, then set the result to the Promise itself
        composableValue
          .then(() => {
            resultRef.value = composableValue; // Set to the Promise, not the resolved value
            if (resolveNextUpdate) {
              resolveNextUpdate();
              resolveNextUpdate = null;
            }
          })
          .catch(() => {
            // Even on error, we're no longer suspended
            resultRef.value = undefined;
            if (resolveNextUpdate) {
              resolveNextUpdate();
              resolveNextUpdate = null;
            }
          });
      } else {
        // If composable returns a value directly, we're not suspended
        resultRef.value = composableValue;
        if (resolveNextUpdate) {
          resolveNextUpdate();
          resolveNextUpdate = null;
        }
      }

      // Watch for changes to the result
      watch(resultRef, newValue => {
        if (newValue !== undefined && resolveNextUpdate) {
          resolveNextUpdate();
          resolveNextUpdate = null;
        }
      });

      expose({ result: resultRef.value });
      return { result: resultRef.value };
    },
    render() {
      return h('div', { 'data-testid': 'composable-result' });
    },
  });

  // Wrap the component to accept composableProps from the external ref
  const WrappedTestComponent = defineComponent({
    name: 'WrappedTestComponent',
    setup() {
      return () =>
        h(TestComponent, {
          composableProps: props,
        });
    },
  });

  const { wrapper, controller, cleanup, allSettled } = mountDataClient(
    WrappedTestComponent,
    options,
  );

  const waitForNextUpdate = (): Promise<void> => {
    return new Promise(resolve => {
      // If result is already available, resolve immediately
      if (resultRef.value !== undefined) {
        resolve();
        return;
      }

      // Otherwise, wait for the result to be set
      resolveNextUpdate = resolve;

      // Also set up a timeout to prevent hanging
      setTimeout(() => {
        if (resolveNextUpdate === resolve) {
          resolveNextUpdate = null;
          resolve();
        }
      }, 1000);
    });
  };

  return {
    result: {
      get current() {
        return resultRef?.value;
      },
    },
    wrapper,
    controller,
    cleanup,
    allSettled,
    waitForNextUpdate,
  };
}
