import { Fixture, Interceptor, MockProps } from '@data-client/core/mock';
export { ErrorFixture, ErrorFixtureEndpoint, Fixture, FixtureEndpoint, Interceptor, MockController, SuccessFixture, SuccessFixtureEndpoint, mockInitialState } from '@data-client/core/mock';
import { Manager, State, GCInterface, Controller } from '@data-client/core';
import { VueWrapper } from '@vue/test-utils';
import { Reactive, App } from 'vue';

interface RenderDataClientOptions<P = any> {
    props?: Reactive<P>;
    initialFixtures?: readonly Fixture[];
    resolverFixtures?: readonly (Fixture | Interceptor)[];
    getInitialInterceptorData?: () => any;
    managers?: Manager[];
    initialState?: State<unknown>;
    gcPolicy?: GCInterface;
    wrapper?: any;
}
interface RenderDataClientResult {
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
declare function mountDataClient<P = any>(component: any, options?: RenderDataClientOptions<P>): RenderDataClientResult;

/**
 * Renders a Vue composable with DataClient provider for testing
 *
 * @see https://dataclient.io/vue/guides/unit-testing-composables
 * @param composable - The composable function to test
 * @param options - Configuration including optional reactive props ref, fixtures, managers, etc.
 */
declare function renderDataCompose<P = any, R = any>(composable: (props: P) => R, options?: RenderDataClientOptions<P>): Promise<{
    result: R;
    wrapper: VueWrapper<any>;
    controller: Controller;
    cleanup: () => void;
    allSettled: () => Promise<PromiseSettledResult<unknown>[]>;
    waitForNextUpdate: () => Promise<void>;
}>;

interface MockPluginOptions<T = any> extends MockProps<T> {
    silenceMissing?: boolean;
}
/**
 * Vue 3 Plugin for mocking Data Client responses based on fixtures
 *
 * Usage:
 * ```ts
 * import { createApp } from 'vue';
 * import { DataClientPlugin } from '@data-client/vue';
 * import { MockPlugin } from '@data-client/vue/test';
 *
 * const app = createApp(App);
 * app.use(DataClientPlugin);
 * app.use(MockPlugin, {
 *   fixtures: [
 *     {
 *       endpoint: MyResource.get,
 *       args: [{ id: 1 }],
 *       response: { id: 1, name: 'Test' },
 *     },
 *   ],
 * });
 * app.mount('#app');
 * ```
 *
 * Place after DataClientPlugin and before mounting the app.
 */
declare const MockPlugin: {
    install<T = any>(app: App, options?: MockPluginOptions<T>): void;
};

export { MockPlugin, type MockPluginOptions, type RenderDataClientOptions, type RenderDataClientResult, mountDataClient, renderDataCompose };
