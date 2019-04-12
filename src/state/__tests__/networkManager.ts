import { cleanup } from 'react-testing-library';
import NetworkManager from '../NetworkManager';
import { FetchAction } from '../../types';
import { ArticleResource } from '../../__tests__/common';

afterEach(cleanup);

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  const getState = () => {};
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
  describe('middleware', () => {
    const fetchResolveAction: FetchAction = {
      type: 'fetch',
      payload: () => Promise.resolve({ id: 5, title: 'hi' }),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: 'receive',
        throttle: false,
        reject: (v: any) => null,
        resolve: (v: any) => null,
      },
    };
    const fetchRejectAction: FetchAction = {
      type: 'fetch',
      payload: () => Promise.reject(new Error('Failed')),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: 'receive',
        throttle: false,
        reject: (v: any) => null,
        resolve: (v: any) => null,
      },
    };
    it('should handle fetch actions and dispatch on success', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const next = jest.fn();
      const dispatch = jest.fn();

      middleware({ dispatch, getState })(next)(fetchResolveAction);

      const data = await fetchResolveAction.payload();

      expect(next).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({
        type: fetchResolveAction.meta.responseType,
        payload: data,
        meta: {
          schema: fetchResolveAction.meta.schema,
          url: fetchResolveAction.meta.url,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
        },
      });
    });
    it('should use dataExpireLength from action if specified', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      middleware({ dispatch, getState })(() => {})({
        ...fetchResolveAction,
        meta: {
          ...fetchResolveAction.meta,
          options: { dataExpiryLength: 314 },
        },
      });

      await fetchResolveAction.payload();

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(314);
    });
    it('should use dataExpireLength from NetworkManager if not specified in action', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      middleware({ dispatch, getState })(() => {})({
        ...fetchResolveAction,
        meta: {
          ...fetchResolveAction.meta,
          options: { dataExpiryLength: undefined },
        },
      });

      await fetchResolveAction.payload();

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(42);
    });
    it('should handle fetch actions and dispatch on error', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const next = jest.fn();
      const dispatch = jest.fn();

      middleware({ dispatch, getState })(next)(fetchRejectAction);
      try {
        await fetchRejectAction.payload();
      } catch (error) {
        expect(next).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
          type: fetchRejectAction.meta.responseType,
          payload: error,
          meta: {
            schema: fetchRejectAction.meta.schema,
            url: fetchRejectAction.meta.url,
            date: expect.any(Number),
            expiresAt: expect.any(Number),
          },
          error: true,
        });
      }
    });
    it('should use errorExpireLength from action if specified', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      middleware({ dispatch, getState })(() => {})({
        ...fetchRejectAction,
        meta: {
          ...fetchRejectAction.meta,
          options: { errorExpiryLength: 1234 },
        },
      });

      try {
        await fetchRejectAction.payload();
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(1234);
      }
    });
    it('should use errorExpireLength from NetworkManager if not specified in action', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      middleware({ dispatch, getState })(() => {})({
        ...fetchRejectAction,
        meta: {
          ...fetchRejectAction.meta,
          options: { errorExpiryLength: undefined },
        },
      });

      try {
        await fetchRejectAction.payload();
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(7);
      }
    });
  });
});

describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RIC } = require('../NetworkManager');
    const fn = jest.fn();
    jest.useFakeTimers();
    RIC(fn, {});
    jest.runAllTimers();
    expect(fn).toBeCalled();
    (global as any).requestIdleCallback = requestIdle;
  });
});
