import { CacheProvider as CoreCacheProvider } from '@rest-hooks/core';
import {
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from 'rest-hooks/manager';

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
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production')
  CacheProvider.defaultProps.managers.unshift(new DevToolsManager());

export { CacheProvider, ExternalCacheProvider, PromiseifyMiddleware };
