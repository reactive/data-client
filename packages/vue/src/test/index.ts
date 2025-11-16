export { MockController } from '@data-client/core/mock';
export { mountDataClient } from './mountDataClient.js';
export { renderDataCompose } from './renderDataCompose.js';
export { MockPlugin, type MockPluginOptions } from './MockPlugin.js';
export type {
  RenderDataClientOptions,
  RenderDataClientResult,
} from './mountDataClient.js';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
  Interceptor,
} from '@data-client/core/mock';
export { default as mockInitialState } from './mockState.js';
