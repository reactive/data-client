export { default as MockResolver } from './MockResolver.js';
export { DataProviderProps, RenderDataHook, RenderDataHookResult, default as makeRenderDataClient, default as makeRenderDataHook } from './makeRenderDataClient/index.js';
export * from './renderDataHook.js';
export { ErrorFixture, ErrorFixtureEndpoint, Fixture, FixtureEndpoint, Interceptor, SuccessFixture, SuccessFixtureEndpoint, mockInitialState } from '/home/ntucker/src/dc-bench/packages/react/lib/mock/index.d.ts';
import { ActType, RenderHook } from './makeRenderDataClient/renderHookTypes.js';
export { RenderHookOptions } from './makeRenderDataClient/renderHookOptions.js';

declare const act: ActType;
declare const renderHook: RenderHook;

export { act, renderHook };
