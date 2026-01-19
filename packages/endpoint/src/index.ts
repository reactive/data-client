Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
export type {
  EndpointOptions,
  EndpointInstance,
  EndpointInstanceInterface,
  EndpointExtendOptions,
} from './endpoint.js';
export * as schema from './schema.js';
// Direct exports of schema members (except Object and Array)
export { Union, Invalidate, Collection, Query, Values, All } from './schema.js';
// Without this we get 'cannot be named without a reference to' for resource()....why is this?
// Clue 1) It only happens with types mentioned in return types of other types
export type { Array, DefaultArgs, Object } from './schema.js';
export { default as Entity } from './schemas/Entity.js';
export { default as EntityMixin } from './schemas/EntityMixin.js';
export type { IEntityClass, IEntityInstance } from './schemas/EntityTypes.js';
export { default as validateRequired } from './validateRequired.js';
export * from './interface.js';
export type { EntityFields } from './schemas/EntityFields.js';
export type {
  AbstractInstanceType,
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
  SchemaArgs,
  ObjectArgs,
  EntityMap,
  RecordClass,
  NormalizedNullableObject,
  NormalizeObject,
  NormalizedEntity,
  DenormalizeObject,
  DenormalizeNullableObject,
} from './normal.js';
export type {
  EndpointExtraOptions,
  FetchFunction,
  ResolveType,
  EndpointParam,
  NetworkError,
  UnknownError,
  ErrorTypes,
  EndpointToFunction,
} from './types.js';
export type { NI } from './NoInfer.js';

export { default as Endpoint, ExtendableEndpoint } from './endpoint.js';
export type { KeyofEndpointInstance } from './endpoint.js';
