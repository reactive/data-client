import { SubscriptionManager } from 'rest-hooks/manager';
import { CacheProvider as CoreCacheProvider } from '@rest-hooks/core';

import { CacheProvider } from '../provider';

describe('CacheProvider', () => {
  it('should have SubscriptionManager in default managers', () => {
    const subManagers = CacheProvider.defaultProps.managers.filter(
      manager => manager instanceof SubscriptionManager,
    );
    expect(subManagers.length).toBe(1);
  });

  it('from core should not have SubscriptionManager in default managers', () => {
    const subManagers = CoreCacheProvider.defaultProps.managers.filter(
      manager => manager instanceof SubscriptionManager,
    );
    expect(subManagers.length).toBe(0);
  });
});
