export { default as MockResolver } from './MockResolver.js';
export {
  default as makeRenderDataClient,
  default as makeRenderDataHook,
} from './makeRenderDataClient/index.js';
export type {
  RenderDataHook,
  RenderDataHookResult,
  DataProviderProps,
} from './makeRenderDataClient/index.js';
export * from './renderDataHook.js';
export type {
  FixtureEndpoint,
  SuccessFixtureEndpoint,
  ErrorFixtureEndpoint,
  Fixture,
  SuccessFixture,
  ErrorFixture,
  Interceptor,
} from '@data-client/react/mock';
export { mockInitialState } from '@data-client/react/mock';
import {
  act as cjsAct,
  renderHook as cjsRenderHook,
} from './makeRenderDataClient/renderHook.cjs';
import type {
  ActType,
  RenderHook,
} from './makeRenderDataClient/renderHookTypes.js';
export type { RenderHookOptions } from './makeRenderDataClient/renderHookOptions.js';

// Annotated so our declarations don't import renderHook.cjs, which TypeScript < 4.5 can't resolve
export const act: ActType = cjsAct;
export const renderHook: RenderHook = cjsRenderHook;
