Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
export { default as MockResolver } from './MockResolver.js';
export {
  default as makeRenderDataClient,
  default as makeRenderDataHook,
} from './makeRenderDataClient/index.js';
export type {
  RenderDataHook,
  DataProviderProps,
} from './makeRenderDataClient/index.js';
export * from './renderDataHook.js';
import mockInitialState from './mockState.js';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
  Interceptor,
} from './fixtureTypes.js';
export { act, renderHook } from './makeRenderDataClient/renderHook.cjs';
export type { RenderHookOptions } from './makeRenderDataClient/renderHook.cjs';

export { mockInitialState };
