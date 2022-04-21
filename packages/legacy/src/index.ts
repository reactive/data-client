export * from './resource/index.js';
export { default as useStatefulResource } from './useStatefulResource.js';
export { default as shapeToEndpoint } from './shapeToEndpoint.js';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
  SetShapeParams,
  ParamsFromShape,
} from '@rest-hooks/core';
export * as rest3 from './rest-3/index';
