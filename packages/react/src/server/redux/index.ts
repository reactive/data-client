export { applyManager, initialState, createReducer } from '@data-client/core';
export { prepareStore } from './prepareStore.js';
export { default as DataProvider } from './DataProvider.js';
export { default as ExternalDataProvider } from './ExternalDataProvider.js';
export { default as mapMiddleware } from './mapMiddleware.js';
export { default as PromiseifyMiddleware } from './PromiseifyMiddleware.js';
export type { Reducer, Middleware } from './redux.js';
