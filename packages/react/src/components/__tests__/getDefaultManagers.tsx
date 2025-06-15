import {
  NetworkManager,
  SubscriptionManager,
  DevToolsManager,
} from '@data-client/core';

import { getDefaultManagers } from '../getDefaultManagers';

describe('getDefaultManagers()', () => {
  let warnspy: jest.Spied<any>;
  let debugspy: jest.Spied<any>;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    debugspy = jest.spyOn(global.console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
    debugspy.mockRestore();
  });

  let errorSpy: jest.Spied<typeof console.error>;
  afterEach(() => {
    errorSpy.mockRestore();
  });
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });
  it('should have SubscriptionManager in default managers', () => {
    const subManagers = getDefaultManagers().find(
      manager => manager instanceof SubscriptionManager,
    );
    expect(subManagers).toBeDefined();
  });
  it('should have NetworkManager in default managers', () => {
    const networkManager = getDefaultManagers().find(
      manager => manager instanceof NetworkManager,
    );
    expect(networkManager).toBeDefined();
  });
  it('should have DevToolsManager in default managers', () => {
    const devtoolsMgr = getDefaultManagers().find(
      manager => manager instanceof DevToolsManager,
    );
    expect(devtoolsMgr).toBeDefined();
  });
  it('null option should disable a manager', () => {
    expect(
      getDefaultManagers({ devToolsManager: null }).find(
        manager => manager instanceof DevToolsManager,
      ),
    ).toBeUndefined();
    expect(
      getDefaultManagers({ subscriptionManager: null }).find(
        manager => manager instanceof SubscriptionManager,
      ),
    ).toBeUndefined();
  });

  it('networkManager should not be removable', () => {
    expect(
      // @ts-expect-error
      getDefaultManagers({ networkManager: null }).find(
        manager => manager instanceof NetworkManager,
      ),
    ).toBeDefined();
    expect(errorSpy.mock.calls).toMatchSnapshot();
  });

  it('manager constructor options should work', () => {
    const managers = getDefaultManagers({
      networkManager: { dataExpiryLength: 1 },
      devToolsManager: {
        maxAge: 1000,
      },
    });
    expect(
      managers.find(manager => manager instanceof NetworkManager)
        ?.dataExpiryLength,
    ).toBe(1);
    // check that the value set is not default
    expect(
      managers.find(manager => manager instanceof DevToolsManager)
        ?.maxBufferLength,
    ).not.toBe(DevToolsManager.prototype.maxBufferLength);
  });

  it('manager instance should work', () => {
    class MyDevTool extends DevToolsManager {
      maxBufferLength = 500;
    }
    const managers = getDefaultManagers({
      networkManager: new NetworkManager({ dataExpiryLength: 1 }),
      devToolsManager: new MyDevTool(),
    });
    expect(
      managers.find(manager => manager instanceof NetworkManager)
        ?.dataExpiryLength,
    ).toBe(1);
    // check that the value set is not default
    expect(
      managers.find(manager => manager instanceof DevToolsManager)
        ?.maxBufferLength,
    ).not.toBe(DevToolsManager.prototype.maxBufferLength);
  });
});
