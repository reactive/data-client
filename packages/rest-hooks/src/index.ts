import {
  Resource,
  SimpleResource,
  SimpleRecord,
  Entity,
  isEntity,
} from './resource';
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

const __INTERNAL__ = {
  initialState,
  StateContext,
  DispatchContext,
  RIC,
  hasUsableData,
  buildInferredResults,
  isEntity,
};

export type NetworkError = OGNetworkError;

export * from './types';
export * from './resource/shapes';
export * from './resource/normal';
export * from './resource/publicTypes';
export {
  Resource,
  SimpleResource,
  Entity,
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
