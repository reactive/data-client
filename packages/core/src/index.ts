export * as __INTERNAL__ from '@rest-hooks/core/internal';
export {
  default as NetworkManager,
  ResetError,
} from '@rest-hooks/core/state/NetworkManager';
export {
  default as reducer,
  initialState,
} from '@rest-hooks/core/state/reducer';
export { useDenormalized } from '@rest-hooks/core/state/selectors/index';
export {
  useCache,
  useFetcher,
  useFetchDispatcher,
  useRetrieve,
  useResource,
  useSubscription,
  useMeta,
  useError,
  CacheProvider,
  useInvalidator,
  useInvalidateDispatcher,
  useResetter,
  hasUsableData,
} from '@rest-hooks/core/react-integration/index';
export type { ErrorTypes } from '@rest-hooks/core/react-integration/index';
export {
  StateContext,
  DispatchContext,
  DenormalizeCacheContext,
} from '@rest-hooks/core/react-integration/context';

export * from '@rest-hooks/core/state/actions/index';
export * as actionTypes from '@rest-hooks/core/actionTypes';
export * from '@rest-hooks/use-enhanced-reducer';
export * from '@rest-hooks/endpoint';
/* istanbul ignore next */
export * from '@rest-hooks/core/types';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
} from '@rest-hooks/core/endpoint/shapes';
export type {
  SetShapeParams,
  ParamsFromShape,
  BodyFromShape,
  ReturnFromShape,
} from '@rest-hooks/core/endpoint/types';
