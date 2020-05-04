import { Resource, SimpleResource, SimpleRecord } from './resource';
import NetworkManager from './state/NetworkManager';
import RIC from './state/RIC';
import PollingSubscription from './state/PollingSubscription';
import SubscriptionManager from './state/SubscriptionManager';
import reducer, { initialState } from './state/reducer';
import { useDenormalized } from './state/selectors';
import buildInferredResults from './state/selectors/buildInferredResults';
import {
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
  ExternalCacheProvider,
  PromiseifyMiddleware,
  NetworkErrorBoundary,
  NetworkError as OGNetworkError,
} from './react-integration';
import useSelectionUnstable from './react-integration/hooks/useSelection';
import hasUsableData from './react-integration/hooks/hasUsableData';
import { StateContext, DispatchContext } from './react-integration/context';

export {
  Entity as NestedEntity,
  isEntity,
  FlatEntity as Entity,
} from '@rest-hooks/normalizr';

const __INTERNAL__ = {
  initialState,
  StateContext,
  DispatchContext,
  RIC,
  hasUsableData,
  buildInferredResults,
};

export type NetworkError = OGNetworkError;

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
} from './resource/shapes';
export * from './resource/normal';
export type { SetShapeParams, ParamsFromShape } from './resource/publicTypes';
export type { EntitySchema } from '@rest-hooks/normalizr';
export {
  Resource,
  SimpleResource,
  SimpleRecord,
  CacheProvider,
  ExternalCacheProvider,
  PromiseifyMiddleware,
  useCache,
  useFetcher,
  useRetrieve,
  useInvalidator,
  useResetter,
  useResource,
  useSubscription,
  useMeta,
  useError,
  useSelectionUnstable,
  useDenormalized,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  reducer,
  NetworkErrorBoundary,
  __INTERNAL__,
};
