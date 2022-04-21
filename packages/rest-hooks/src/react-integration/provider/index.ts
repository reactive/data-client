import {
  CacheProvider as CoreCacheProvider,
  NetworkManager,
} from '@rest-hooks/core';

import {
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from '../../manager/index.js';
import PromiseifyMiddleware from './PromiseifyMiddleware.js';
import ExternalCacheProvider from './ExternalCacheProvider.js';

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
export { default as mapMiddleware } from './mapMiddleware.js';
