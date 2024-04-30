Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
export { default as MockResolver } from './MockResolver.js';
import makeRenderDataClient from './makeRenderDataClient/index.js';
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

export { makeRenderDataClient, mockInitialState };
