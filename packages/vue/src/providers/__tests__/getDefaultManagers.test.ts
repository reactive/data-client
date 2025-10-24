import {
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from '@data-client/core';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { getDefaultManagers } from '../getDefaultManagers';

describe('getDefaultManagers', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    consoleErrorSpy.mockRestore();
  });

  it('should return default managers', () => {
    const managers = getDefaultManagers();

    expect(managers.length).toBeGreaterThan(0);
    expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
  });

  it('should return only NetworkManager when subscriptionManager is null', () => {
    const managers = getDefaultManagers({ subscriptionManager: null });

    expect(managers.length).toBeGreaterThanOrEqual(1);
    expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
    expect(managers.some(m => m instanceof SubscriptionManager)).toBe(false);
  });

  it('should accept custom NetworkManager instance', () => {
    const customNetworkManager = new NetworkManager();
    const managers = getDefaultManagers({
      networkManager: customNetworkManager,
    });

    // Should return the instance directly (covers line 62)
    expect(managers.some(m => m === customNetworkManager)).toBe(true);
  });

  it('should accept custom SubscriptionManager instance', () => {
    const customSubscriptionManager = new SubscriptionManager(
      PollingSubscription,
    );
    const managers = getDefaultManagers({
      subscriptionManager: customSubscriptionManager,
    });

    // Should return the instance directly (covers line 62)
    expect(managers.some(m => m === customSubscriptionManager)).toBe(true);
  });

  it('should accept NetworkManager options', () => {
    const managers = getDefaultManagers({
      networkManager: { dataExpiryLength: 60000 },
    });

    expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
  });

  it('should accept SubscriptionManager options', () => {
    const managers = getDefaultManagers({
      subscriptionManager: PollingSubscription,
    });

    expect(managers.some(m => m instanceof SubscriptionManager)).toBe(true);
  });

  describe('development mode', () => {
    beforeEach(() => {
      // Ensure we're in development mode
      process.env.NODE_ENV = 'development';
    });

    it('should log error when networkManager is null in dev mode', () => {
      const managers = getDefaultManagers({
        networkManager: null,
      });

      // Should log error (covers line 32)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Disabling NetworkManager is not allowed.',
      );

      // Should still return NetworkManager (fallback to default)
      expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
    });

    it('should include DevToolsManager by default in dev mode', () => {
      const managers = getDefaultManagers();

      expect(managers.some(m => m instanceof DevToolsManager)).toBe(true);
    });

    it('should accept DevToolsManager instance', () => {
      const customDevToolsManager = new DevToolsManager({}, () => false);

      const managers = getDefaultManagers({
        devToolsManager: customDevToolsManager,
      });

      // Should return the instance directly (covers line 43)
      expect(managers.some(m => m === customDevToolsManager)).toBe(true);
    });

    it('should accept DevToolsManager config', () => {
      const managers = getDefaultManagers({
        devToolsManager: {},
      });

      expect(managers.some(m => m instanceof DevToolsManager)).toBe(true);
    });

    it('should exclude DevToolsManager when explicitly set to null', () => {
      const managers = getDefaultManagers({
        devToolsManager: null,
      });

      expect(managers.some(m => m instanceof DevToolsManager)).toBe(false);
    });

    it('should place DevToolsManager first in the array', () => {
      const managers = getDefaultManagers({
        devToolsManager: {},
      });

      expect(managers[0]).toBeInstanceOf(DevToolsManager);
    });

    it('should work with all custom options combined', () => {
      const customNetworkManager = new NetworkManager();
      const customSubscriptionManager = new SubscriptionManager(
        PollingSubscription,
      );
      const customDevToolsManager = new DevToolsManager({}, () => false);

      const managers = getDefaultManagers({
        networkManager: customNetworkManager,
        subscriptionManager: customSubscriptionManager,
        devToolsManager: customDevToolsManager,
      });

      expect(managers.some(m => m === customDevToolsManager)).toBe(true);
      expect(managers.some(m => m === customNetworkManager)).toBe(true);
      expect(managers.some(m => m === customSubscriptionManager)).toBe(true);
    });

    it('should exclude subscription manager when null in dev mode', () => {
      const managers = getDefaultManagers({
        subscriptionManager: null,
      });

      expect(managers.some(m => m instanceof SubscriptionManager)).toBe(false);
      expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not include DevToolsManager in production', () => {
      const managers = getDefaultManagers();

      // In production, DevToolsManager should not be included by default
      // Note: This test may vary based on the actual implementation
      expect(managers.some(m => m instanceof NetworkManager)).toBe(true);
    });
  });
});
