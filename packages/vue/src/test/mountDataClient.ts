import {
  State,
  Manager,
  Controller,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  type GCInterface,
} from '@data-client/core';
import type { Interceptor, Fixture } from '@data-client/core/mock';
import { MockController } from '@data-client/core/mock';
import { mount, type VueWrapper } from '@vue/test-utils';
import {
  defineComponent,
  h,
  Suspense,
  inject,
  nextTick,
  type Reactive,
  reactive,
} from 'vue';

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
 * Renders a Vue component with DataClient plugin and fixtures for testing
 *
 * @see https://dataclient.io/vue/guides/unit-testing-components
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

  // Ticks before and after so fetches that watchers start on a prop change are included, and
  // the component has re-rendered with their results
  const allSettled = async (): Promise<PromiseSettledResult<unknown>[]> => {
    await nextTick();
    const results = (await nm.allSettled()) ?? [];
    await nextTick();
    return results;
  };

  return {
    wrapper: wrapper_instance,
    controller,
    app: wrapper_instance.vm,
    cleanup,
    allSettled,
  };
}
