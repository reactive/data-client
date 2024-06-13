import createPersistedStoreClient from './createPersistedStoreClient.js';
import createPersistedStoreServer from './createPersistedStoreServer.js';

const createPersistedStore =
  typeof window === 'undefined' ?
    createPersistedStoreServer
  : createPersistedStoreClient;
export default createPersistedStore;
