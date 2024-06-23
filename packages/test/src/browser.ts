Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
import mockInitialState from './mockState.js';
export { default as MockResolver } from './MockResolver.js';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
  Interceptor,
} from './fixtureTypes.js';

export { mockInitialState };
