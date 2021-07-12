import makeRenderRestHook from '@rest-hooks/test/makeRenderRestHook';
import {
  makeExternalCacheProvider,
  makeCacheProvider,
} from '@rest-hooks/test/providers';
import MockProvider from '@rest-hooks/test/MockProvider';
import mockInitialState from '@rest-hooks/test/mockState';
export * from '@rest-hooks/test/managers';
export { default as MockResolver } from '@rest-hooks/test/MockResolver';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
} from '@rest-hooks/test/mockState';

export {
  makeRenderRestHook,
  makeExternalCacheProvider,
  makeCacheProvider,
  MockProvider,
  mockInitialState,
};
