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
// Without this we get 'cannot be named without a reference to' for createResource()....why is this?
// Clue 1) It only happens with types mentioned in return types of other types
export type { Array, Invalidate, Collection } from './schema.js';
export { default as Entity } from './schemas/Entity.js';
export { default as validateRequired } from './validateRequired.js';
export { INVALID } from './special.js';
export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  Schema,
  SnapshotInterface,
  ExpiryStatusInterface,
  SchemaSimple,
  SchemaClass,
  PolymorphicInterface,
  Queryable,
} from './interface.js';
export type {
  AbstractInstanceType,
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
  SchemaArgs,
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

export { default as Endpoint, ExtendableEndpoint } from './endpoint.js';
export type { KeyofEndpointInstance } from './endpoint.js';
