import { Controller } from '@data-client/core';
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
    const provider = createDataClient({ ...options, app });

    app.config.globalProperties.$dataClient = provider.controller;

    /* istanbul ignore if */
    if (process.env.NODE_ENV === 'development') {
      console.info('Starting DataClientPlugin');
    }

    provider.start();

    app.onUnmount(() => {
      /* istanbul ignore if */
      if (process.env.NODE_ENV === 'development') {
        console.info('Stopping DataClientPlugin');
      }

      provider.stop();
    });

    return provider;
  },
};

// install global property types

declare module 'vue' {
  interface ComponentCustomProperties {
    $dataClient: Controller;
  }
}
