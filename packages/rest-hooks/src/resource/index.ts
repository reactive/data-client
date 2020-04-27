import Resource from './Resource';
export { Entity, SimpleRecord } from '@rest-hooks/normalizr';
export type { EntitySchema } from '@rest-hooks/normalizr';
import SimpleResource from './SimpleResource';
export type { FetchShape, ReadShape, MutateShape, DeleteShape } from './shapes';
export * from './types';
export type {
  SetShapeParams,
  ParamsFromShape,
  OptimisticUpdateParams,
  SchemaFromShape,
  BodyFromShape,
} from './publicTypes';
export * from './normal';

export { Resource, SimpleResource };
