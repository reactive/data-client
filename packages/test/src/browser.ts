Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
import MockProvider from './MockProvider.js';
import mockInitialState from './mockState.js';
export { default as MockResolver } from './MockResolver.js';
export type { Fixture, SuccessFixture, ErrorFixture } from './mockState.js';

export { MockProvider, mockInitialState };
