import { DELETED } from '@rest-hooks/normalizr';

import buildInferredResults from './state/selectors/buildInferredResults';
import RIC from './state/RIC';

const __INTERNAL__ = {
  buildInferredResults,
  RIC,
  DELETED,
};

export { __INTERNAL__ };
export { default as NetworkManager } from './state/NetworkManager';
export { default as reducer, initialState } from './state/reducer';
export { useDenormalized } from './state/selectors';
export {
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useMeta,
  useError,
  CacheProvider,
  useInvalidator,
  useResetter,
  hasUsableData,
} from './react-integration';
export { StateContext, DispatchContext } from './react-integration/context';

export {
  SimpleRecord,
  Entity,
  isEntity,
  FlatEntity,
  schema,
} from '@rest-hooks/normalizr';
export type { Schema } from '@rest-hooks/normalizr';
export type {
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
} from './normal';

export * from './state/actions';
export * as actionTypes from './actionTypes';
export * from '@rest-hooks/use-enhanced-reducer';
export * from '@rest-hooks/endpoint';
/* istanbul ignore next */
export * from './types';
export type { FetchShape, ReadShape, MutateShape } from './endpoint/shapes';
export type {
  SetShapeParams,
  ParamsFromShape,
  ReturnFromShape,
} from './endpoint/types';
