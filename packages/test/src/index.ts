Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
import makeRenderRestHook from './makeRenderRestHook.js';
import MockProvider from './MockProvider.js';
import mockInitialState from './mockState.js';
export * from './managers.js';
export { default as MockResolver } from './MockResolver.js';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
} from './mockState.js';
export { act } from './renderHook.cjs';

export { makeRenderRestHook, MockProvider, mockInitialState };
