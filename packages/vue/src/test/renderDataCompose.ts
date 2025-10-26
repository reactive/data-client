import { type Controller } from '@data-client/core';
import { type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, watch, reactive, nextTick, isRef } from 'vue';

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
export async function renderDataCompose<P = any, R = any>(
  composable: (props: P) => R,
  options: RenderDataClientOptions<P> = {},
): Promise<{
  result: R;
  wrapper: VueWrapper<any>;
  controller: Controller;
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]>;
  waitForNextUpdate: () => Promise<void>;
}> {
  // Extract props from options, or create empty ref if not provided
  const props = options.props || reactive({});

  let resultRef: any;
  let resolveNextUpdate: (() => void) | null = null;
  let resolveComposableInit: (() => void) | null = null;

  // Promise that resolves when the composable has been called
  const composableInitialized = new Promise<void>(resolve => {
    resolveComposableInit = resolve;
  });

  const TestComponent = defineComponent({
    name: 'TestComposableComponent',
    props: {
      composableProps: {
        type: Object,
        required: true,
      },
    },
    setup(componentProps, { expose }) {
      // Call the composable once with reactive props - Vue's useSuspense will handle the async behavior
      const composableValue = composable(componentProps.composableProps as P);

      // Store the composable value directly without wrapping
      resultRef = composableValue;

      // Signal that the composable has been initialized
      if (resolveComposableInit) {
        resolveComposableInit();
        resolveComposableInit = null;
      }

      // If composable returns a Promise, wait for it to resolve before triggering update callbacks
      if (composableValue instanceof Promise) {
        composableValue
          .then(() => {
            if (resolveNextUpdate) {
              resolveNextUpdate();
              resolveNextUpdate = null;
            }
          })
          .catch(() => {
            if (resolveNextUpdate) {
              resolveNextUpdate();
              resolveNextUpdate = null;
            }
          });
      } else {
        // If composable returns a value directly, trigger update immediately
        if (resolveNextUpdate) {
          resolveNextUpdate();
          resolveNextUpdate = null;
        }
      }

      // Watch for changes to the result if it's reactive
      if (isRef(resultRef)) {
        watch(resultRef, () => {
          if (resolveNextUpdate) {
            resolveNextUpdate();
            resolveNextUpdate = null;
          }
        });
      }

      expose({ result: resultRef });
      return { result: resultRef };
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

  // Wait for the composable to be initialized before returning
  await composableInitialized;
  // Give Vue's reactivity system time to process the initial values
  await nextTick();

  const waitForNextUpdate = async (): Promise<void> => {
    // For Promises (like useSuspense), wait for them to resolve
    const valueToCheck = isRef(resultRef) ? resultRef.value : resultRef;
    if (valueToCheck instanceof Promise) {
      return new Promise(resolve => {
        resolveNextUpdate = resolve;
        setTimeout(() => {
          if (resolveNextUpdate === resolve) {
            resolveNextUpdate = null;
            resolve();
          }
        }, 1000);
      });
    }

    await allSettled();
    await nextTick();
  };

  return {
    result: resultRef,
    wrapper,
    controller,
    cleanup,
    allSettled,
    waitForNextUpdate,
  };
}
