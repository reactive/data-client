export * from '@rest-hooks/legacy/resource/index';
export { default as useStatefulResource } from '@rest-hooks/legacy/useStatefulResource';
export { default as shapeToEndpoint } from '@rest-hooks/legacy/shapeToEndpoint';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
  SetShapeParams,
  ParamsFromShape,
} from '@rest-hooks/core';
export * as rest3 from './rest-3';
