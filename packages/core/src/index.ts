import buildInferredResults from './state/selectors/buildInferredResults';
import RIC from './state/RIC';

const __INTERNAL__ = {
  buildInferredResults,
  RIC,
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
} from './endpoint/normal';

export * from './state/actions';
export * as actionTypes from './actionTypes';
export * from '@rest-hooks/use-enhanced-reducer';
/* istanbul ignore next */
export * from './types';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
} from './endpoint/shapes';
export type { SetShapeParams, ParamsFromShape } from './endpoint/types';
