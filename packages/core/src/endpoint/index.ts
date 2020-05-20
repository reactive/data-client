export type { FetchShape, ReadShape, MutateShape, DeleteShape } from './shapes';
export type {
  SetShapeParams,
  ParamsFromShape,
  OptimisticUpdateParams,
  SchemaFromShape,
  BodyFromShape,
  ReturnFromShape,
} from './types';
export { isDeleteShape } from './types';

export type {
  Normalize,
  Denormalize,
  DenormalizeNullable,
  NormalizeNullable,
} from './normal';
