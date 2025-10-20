import type { App } from 'vue';

import { createDataClient, type ProvideOptions } from './createDataClient.js';

/**
 * Vue 3 Plugin for Reactive Data Client
 *
 * Usage:
 * ```ts
 * import { createApp } from 'vue';
 * import { DataClientPlugin } from '@data-client/vue';
 *
 * const app = createApp(App);
 * app.use(DataClientPlugin, {
 *   managers: getDefaultManagers(),
 *   initialState: customInitialState,
 * });
 * app.mount('#app');
 * ```
 */
export const DataClientPlugin = {
  install(app: App, options: ProvideOptions = {}) {
    const provider = createDataClient(options);

    // Handle lifecycle in plugin mode
    if (app.mixin) {
      app.mixin({
        beforeMount() {
          provider.start();
        },
        beforeUnmount() {
          provider.stop();
        },
      });
    }

    return provider;
  },
};
