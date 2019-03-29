import { cleanup } from 'react-testing-library';
import NetworkManager from '../NetworkManager';

afterEach(cleanup);

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  describe('getMiddleware()', () => {
    it('should return the same value every call', () => {
      const a = manager.getMiddleware();
      expect(a).toBe(manager.getMiddleware());
      expect(a).toBe(manager.getMiddleware());
    });
  });
  describe('cleanup()', () => {
    it('should reject current promises', async () => {
      let rejection: any;
      let promise = (manager as any)
        .throttle(
          'a',
          () =>
            new Promise(resolve => {
              setTimeout(resolve, 1000);
            }),
        )
        .catch((e: any) => {
          rejection = e;
        });
      manager.cleanup();
      await promise;
      expect(rejection).toBeDefined();
    });
  });
});

describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();
    const { RIC } = require('../NetworkManager');
    const fn = jest.fn();
    jest.useFakeTimers();
    RIC(fn, {});
    jest.runAllTimers();
    expect(fn).toBeCalled();
    (global as any).requestIdleCallback = requestIdle;
  });
});
