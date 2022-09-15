import { CacheProvider as CoreCacheProvider } from '@rest-hooks/core';
import { render } from '@testing-library/react';

import { SubscriptionManager } from '../../manager';
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

  it('should render', () => {
    const tree = <CacheProvider>hi</CacheProvider>;
    render(tree);
  });
});
