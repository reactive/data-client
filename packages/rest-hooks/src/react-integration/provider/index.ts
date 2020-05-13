import { CacheProvider as CoreCacheProvider } from '@rest-hooks/core';
import { SubscriptionManager, PollingSubscription } from 'rest-hooks/manager';

import PromiseifyMiddleware from './PromiseifyMiddleware';
import ExternalCacheProvider from './ExternalCacheProvider';

const CacheProvider: typeof CoreCacheProvider = props =>
  CoreCacheProvider(props);
CacheProvider.defaultProps = {
  ...CoreCacheProvider.defaultProps,
  managers: [
    ...CoreCacheProvider.defaultProps.managers,
    new SubscriptionManager(PollingSubscription),
  ],
};

export { CacheProvider, ExternalCacheProvider, PromiseifyMiddleware };
