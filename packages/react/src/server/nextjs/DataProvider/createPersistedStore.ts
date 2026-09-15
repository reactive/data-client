import type { Controller as DataController, Manager } from '@data-client/core';

import createPersistedStoreClient from './createPersistedStoreClient.js';
import createPersistedStoreServer from './createPersistedStoreServer.js';

const createPersistedStoreForEnvironment =
  typeof window === 'undefined' ?
    createPersistedStoreServer
  : createPersistedStoreClient;

export default function createPersistedStore(
  managers?: () => Manager[],
  Controller?: typeof DataController,
) {
  if (managers !== undefined && typeof managers !== 'function')
    throw new Error(
      `DataProvider from @data-client/react/nextjs takes managers as a function so every request gets its own instances.
Change managers={[...]} to managers={() => [...]}
See https://dataclient.io/docs/guides/ssr#managers`,
    );
  return createPersistedStoreForEnvironment(managers, Controller);
}
