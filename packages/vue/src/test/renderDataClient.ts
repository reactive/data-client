import {
  State,
  Manager,
  Controller,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  type GCInterface,
} from '@data-client/core';
import { mount, type VueWrapper } from '@vue/test-utils';
import {
  defineComponent,
  h,
  Suspense,
  ref,
  watch,
  inject,
  Reactive,
  reactive,
} from 'vue';

import { Interceptor, Fixture } from './fixtureTypes.js';
import MockController from './MockController.js';
import mockInitialState from './mockState.js';
import { ControllerKey } from '../context.js';
import { DataClientPlugin } from '../providers/DataClientPlugin.js';

export interface RenderDataClientOptions<P = any> {
  props?: Reactive<P>;
  initialFixtures?: readonly Fixture[];
  resolverFixtures?: readonly (Fixture | Interceptor)[];
  getInitialInterceptorData?: () => any;
  managers?: Manager[];
  initialState?: State<unknown>;
  gcPolicy?: GCInterface;
  wrapper?: any;
}

export interface RenderDataClientResult {
  wrapper: VueWrapper<any>;
  controller: Controller;
  app: any;
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]>;
}

/**
 * Renders a Vue component with DataClient provider for testing
 * Similar to renderDataClient from @data-client/test but for Vue
 *
 * @param component - The Vue component to test
 * @param options - Configuration including optional reactive props ref, fixtures, managers, etc.
 */
export function mountDataClient<P = any>(
  component: any,
  options: RenderDataClientOptions<P> = {},
): RenderDataClientResult {
  const {
    initialFixtures = [],
    resolverFixtures,
    getInitialInterceptorData = () => ({}),
    managers,
    initialState,
    gcPolicy,
    wrapper,
  } = options;

  // Extract props from options, or create empty ref if not provided
  const props = options.props || reactive({});

  // Create mock controller with fixtures
  const MockControllerClass = MockController(
    Controller,
    resolverFixtures ?
      {
        fixtures: [...resolverFixtures],
        getInitialInterceptorData,
      }
    : {},
  );

  // Create managers
  const nm = new NetworkManager();
  const sm = new SubscriptionManager(PollingSubscription);
  const defaultManagers = [nm, sm];
  const finalManagers = managers ?? defaultManagers;

  // Create initial state
  const mockState = mockInitialState([...initialFixtures]);
  const finalInitialState = initialState ?? mockState;

  // Create a wrapper component that provides the data client context
  const DataClientWrapper = defineComponent({
    name: 'DataClientWrapper',
    setup(_, { expose }) {
      // Inject the controller provided by the plugin
      const controller = inject(ControllerKey) as Controller;

      // Expose controller for testing
      expose({
        controller,
      });

      return () => {
        const innerComponent =
          wrapper ?
            h(wrapper, props as any, () => h(component, props as any))
          : h(component, props as any);

        return h(
          Suspense,
          {},
          {
            default: () => innerComponent,
            fallback: () =>
              h('div', { 'data-testid': 'suspense-fallback' }, 'Loading...'),
          },
        );
      };
    },
  });

  // Mount the wrapper with DataClientPlugin
  const wrapper_instance = mount(DataClientWrapper, {
    global: {
      plugins: [
        [
          DataClientPlugin,
          {
            managers: finalManagers,
            initialState: finalInitialState,
            Controller: MockControllerClass,
            gcPolicy,
          },
        ],
      ],
    },
  });

  // Get controller from the wrapper
  const controller = (wrapper_instance.vm as any).controller;

  // Cleanup function
  const cleanup = () => {
    nm.cleanupDate = Infinity;
    if ((nm as any)['rejectors']) {
      Object.values((nm as any)['rejectors'] as Record<string, any>).forEach(
        (rej: any) => {
          rej();
        },
      );
    } else if (nm['fetching']) {
      nm['fetching'].forEach(({ reject }: any) => reject());
    }
    nm['clearAll']();
    finalManagers.forEach(manager => manager.cleanup());
    wrapper_instance.unmount();
  };

  // All settled function
  const allSettled = (): Promise<PromiseSettledResult<unknown>[]> => {
    return nm.allSettled() ?? Promise.resolve([]);
  };

  return {
    wrapper: wrapper_instance,
    controller,
    app: wrapper_instance.vm,
    cleanup,
    allSettled,
  };
}

/**
 * Renders a Vue composable with DataClient provider for testing
 * Similar to renderDataHook from @data-client/test but for Vue composables
 *
 * @param composable - The composable function to test
 * @param options - Configuration including optional reactive props ref, fixtures, managers, etc.
 */
export function renderDataClient<P = any, R = any>(
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
