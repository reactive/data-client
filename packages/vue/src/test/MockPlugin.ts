import { Controller } from '@data-client/core';
import { MockController, type MockProps } from '@data-client/core/mock';
import type { App } from 'vue';

import { ControllerKey } from '../context.js';

export interface MockPluginOptions<T = any> extends MockProps<T> {
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
export const MockPlugin = {
  install<T = any>(app: App, options: MockPluginOptions<T> = {}) {
    const { fixtures, getInitialInterceptorData = () => ({}) as any } = options;

    // Get the controller from the app's global properties (set by DataClientPlugin)
    const originalController = app.config.globalProperties.$dataClient as
      | Controller
      | undefined;

    if (!originalController) {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'MockPlugin: DataClientPlugin must be installed before MockPlugin.\n' +
            'Make sure to call app.use(DataClientPlugin) before app.use(MockPlugin).',
        );
      }
      return;
    }

    // Create the mocked controller
    const MockedController = MockController(
      originalController.constructor as any,
      fixtures ?
        {
          fixtures,
          getInitialInterceptorData,
        }
      : {},
    );

    const controllerInterceptor = new MockedController({
      ...originalController,
      dispatch:
        (originalController as any)['_dispatch'] ?? originalController.dispatch,
    });

    // Provide the mocked controller to override the original
    // Note: This intentionally overwrites the controller from DataClientPlugin.
    // Vue will warn about this, but it's expected behavior.
    app.provide(ControllerKey, controllerInterceptor);

    // Also update global properties for consistency
    app.config.globalProperties.$dataClient = controllerInterceptor;

    /* istanbul ignore if */
    if (process.env.NODE_ENV === 'development') {
      console.info(
        'MockPlugin installed with fixtures:',
        fixtures?.length ?? 0,
      );
    }
  },
};
