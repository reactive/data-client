import {
  CacheProvider as CoreCacheProvider,
  NetworkManager,
} from '@rest-hooks/core';
import {
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from 'rest-hooks/manager/index';
import PromiseifyMiddleware from 'rest-hooks/react-integration/provider/PromiseifyMiddleware';
import ExternalCacheProvider from 'rest-hooks/react-integration/provider/ExternalCacheProvider';

const CacheProvider: typeof CoreCacheProvider = props =>
  CoreCacheProvider(props);
CacheProvider.defaultProps = {
  ...CoreCacheProvider.defaultProps,
  managers: [
    ...CoreCacheProvider.defaultProps.managers,
    new SubscriptionManager(PollingSubscription),
  ],
};
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  const networkManager: NetworkManager | undefined =
    CacheProvider.defaultProps.managers.find(
      manager => manager instanceof NetworkManager,
    ) as any;
  CacheProvider.defaultProps.managers.unshift(
    new DevToolsManager(
      undefined,
      networkManager && networkManager.skipLogging.bind(networkManager),
    ),
  );
}

export { CacheProvider, ExternalCacheProvider, PromiseifyMiddleware };
export { default as mapMiddleware } from 'rest-hooks/react-integration/provider/mapMiddleware';
