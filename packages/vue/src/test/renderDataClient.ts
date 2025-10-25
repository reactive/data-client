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
  nextTick,
  inject,
} from 'vue';

import { Interceptor, Fixture } from './fixtureTypes.js';
import MockController from './MockController.js';
import mockInitialState from './mockState.js';
import { ControllerKey } from '../context.js';
import { DataClientPlugin } from '../providers/DataClientPlugin.js';

export interface RenderDataClientOptions<P = any> {
  initialProps?: P;
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
 */
export function renderDataClient<P = any>(
  component: any,
  options: RenderDataClientOptions<P> = {},
): RenderDataClientResult {
  const {
    initialProps,
    initialFixtures = [],
    resolverFixtures,
    getInitialInterceptorData = () => ({}),
    managers,
    initialState,
    gcPolicy,
    wrapper,
  } = options;

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

      // Create a reactive props object that will be updated when setProps is called
      const componentProps = ref(initialProps || {});

      // Expose controller and props updater for testing
      expose({
        controller,
        updateProps: (newProps: any) => {
          // Update the ref value to trigger reactivity
          componentProps.value = { ...newProps };
        },
      });

      return () => {
        // Use key on the component to force re-mount when props change
        // This ensures setup() is re-run with new props
        const componentKey = JSON.stringify(componentProps.value);
        const innerComponent =
          wrapper ?
            h(wrapper, { ...componentProps.value, key: componentKey }, () =>
              h(component, { ...componentProps.value, key: componentKey }),
            )
          : h(component, { ...componentProps.value, key: componentKey });

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

  // Get controller and updateProps from the wrapper
  const controller = (wrapper_instance.vm as any).controller;
  const updateProps = (wrapper_instance.vm as any).updateProps;

  // Override setProps to trigger reactive updates
  wrapper_instance.setProps = async (props: any) => {
    updateProps(props);
    await nextTick();
    // Force a re-render by awaiting next tick again
    await nextTick();
  };

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
 */
export function renderDataComposable<P = any, R = any>(
  composable: (props: P) => R,
  options: RenderDataClientOptions<P> = {},
): {
  result: { current: R | undefined };
  wrapper: VueWrapper<any>;
  controller: Controller;
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]>;
  waitForNextUpdate: () => Promise<void>;
  setProps: (props: Partial<P>) => Promise<void>;
} {
  let resultRef: any;
  let resolveNextUpdate: (() => void) | null = null;
  let composablePropsRef: any;

  const TestComponent = defineComponent({
    name: 'TestComposableComponent',
    props: {
      composableProps: {
        type: Object,
        default: () => ({}),
      },
    },
    setup(props, { expose }) {
      // Create the result ref inside the component
      resultRef = ref<R | undefined>(undefined);

      // Call the composable with reactive props - Vue's useSuspense will handle the async behavior
      const composableValue = composable(props.composableProps as P);

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

  // Wrap the component to accept composableProps
  const WrappedTestComponent = defineComponent({
    name: 'WrappedTestComponent',
    setup(_, { expose }) {
      composablePropsRef = ref(options.initialProps || {});

      // Expose the ref so we can update it from outside
      expose({
        updateComposableProps: (newProps: any) => {
          composablePropsRef.value = {
            ...composablePropsRef.value,
            ...newProps,
          };
        },
      });

      return () =>
        h(TestComponent, { composableProps: composablePropsRef.value });
    },
  });

  const { wrapper, controller, cleanup, allSettled } = renderDataClient(
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

  const setProps = async (props: Partial<P>): Promise<void> => {
    const updateComposableProps = (wrapper.vm as any).updateComposableProps;
    if (updateComposableProps) {
      updateComposableProps(props);
      await nextTick();
      await nextTick();
    }
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
    setProps,
  };
}
