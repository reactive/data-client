import { ArticleResource } from '__tests__/common';

import NetworkManager from '../NetworkManager';
import { FetchAction, ResetAction } from '../../types';
import {
  FETCH_TYPE,
  RECEIVE_TYPE,
  RECEIVE_MUTATE_TYPE,
  RESET_TYPE,
} from '../../actionTypes';

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  const getState = () => {};
  describe('getMiddleware()', () => {
    it('should return the same value every call', () => {
      const a = manager.getMiddleware();
      expect(a).toBe(manager.getMiddleware());
      expect(a).toBe(manager.getMiddleware());
    });
    it('should return the different value for a different instance', () => {
      const a = manager.getMiddleware();
      const manager2 = new NetworkManager();
      const a2 = manager2.getMiddleware();
      expect(a).not.toBe(a2);
      expect(a2).toBe(manager2.getMiddleware());
    });
  });
  describe('cleanup()', () => {
    it('should reject current promises', async () => {
      let rejection: any;
      const promise = (manager as any)
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
      type: FETCH_TYPE,
      payload: () => Promise.resolve({ id: 5, title: 'hi' }),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: RECEIVE_TYPE,
        throttle: false,
        reject: (v: any) => null,
        resolve: (v: any) => null,
      },
    };
    const fetchReceiveWithUpdatersAction: FetchAction = {
      ...fetchResolveAction,
      meta: {
        ...fetchResolveAction.meta,
        updaters: {
          [ArticleResource.listUrl()]: () => (
            result: string[],
            oldResults: string[] | undefined,
          ) => [...(oldResults || []), result] as any,
        },
      },
    };
    const fetchRpcWithUpdatersAction: FetchAction = {
      ...fetchReceiveWithUpdatersAction,
      meta: {
        ...fetchReceiveWithUpdatersAction.meta,
        responseType: RECEIVE_MUTATE_TYPE,
      },
    };
    const fetchRejectAction: FetchAction = {
      type: FETCH_TYPE,
      payload: () => Promise.reject(new Error('Failed')),
      meta: {
        schema: ArticleResource.getEntitySchema(),
        url: ArticleResource.url({ id: 5 }),
        responseType: RECEIVE_TYPE,
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

      expect(next).toHaveBeenCalled();
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
    it('should handle fetch receive action and dispatch on success with updaters', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const next = jest.fn();
      const dispatch = jest.fn();

      middleware({ dispatch, getState })(next)(fetchReceiveWithUpdatersAction);

      const data = await fetchReceiveWithUpdatersAction.payload();

      expect(next).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({
        type: fetchReceiveWithUpdatersAction.meta.responseType,
        payload: data,
        meta: {
          updaters: {
            [ArticleResource.listUrl()]: expect.any(Function),
          },
          schema: fetchReceiveWithUpdatersAction.meta.schema,
          url: fetchReceiveWithUpdatersAction.meta.url,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
        },
      });
    });
    it('should handle fetch rpc action and dispatch on success with updaters', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const next = jest.fn();
      const dispatch = jest.fn();

      middleware({ dispatch, getState })(next)(fetchRpcWithUpdatersAction);

      const data = await fetchRpcWithUpdatersAction.payload();

      expect(next).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({
        type: fetchRpcWithUpdatersAction.meta.responseType,
        payload: data,
        meta: {
          updaters: {
            [ArticleResource.listUrl()]: expect.any(Function),
          },
          schema: fetchRpcWithUpdatersAction.meta.schema,
          url: fetchRpcWithUpdatersAction.meta.url,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
        },
      });
    });
    it('should use dataExpireLength from action if specified', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      middleware({ dispatch, getState })(() => Promise.resolve())({
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

      middleware({ dispatch, getState })(() => Promise.resolve())({
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

      try {
        await middleware({ dispatch, getState })(next)(fetchRejectAction);
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

      try {
        await middleware({ dispatch, getState })(() => Promise.resolve())({
          ...fetchRejectAction,
          meta: {
            ...fetchRejectAction.meta,
            options: { errorExpiryLength: 1234 },
          },
        });
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(1234);
      }
    });
    it('should use errorExpireLength from NetworkManager if not specified in action', async () => {
      const middleware = new NetworkManager(42, 7).getMiddleware();

      const dispatch = jest.fn();

      try {
        await middleware({ dispatch, getState })(() => Promise.resolve())({
          ...fetchRejectAction,
          meta: {
            ...fetchRejectAction.meta,
            options: { errorExpiryLength: undefined },
          },
        });
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(7);
      }
    });
    it('should reject current promises on rest-hooks/reset', async () => {
      const resetAction: ResetAction = { type: RESET_TYPE };
      const manager = new NetworkManager(42, 7);
      const middleware = manager.getMiddleware();
      let rejection: any;

      let resolve: any, reject: any;
      const promise: Promise<any> = new Promise((res, rej) => {
        setTimeout(() => res({ id: 5, title: 'hi' }), 10000);
        resolve = res;
        reject = rej;
      }).catch((e: any) => {
        rejection = e;
        throw e;
      });

      const fetchResolveAction: FetchAction = {
        type: FETCH_TYPE,
        payload: () => promise,
        meta: {
          schema: ArticleResource.getEntitySchema(),
          url: ArticleResource.url({ id: 5 }),
          responseType: RECEIVE_TYPE,
          throttle: true,
          resolve,
          reject,
        },
      };

      const next = jest.fn();
      const dispatch = jest.fn();

      expect(Object.keys((manager as any).rejectors).length).toBe(0);
      (manager as any).handleFetch(fetchResolveAction, dispatch);
      expect(Object.keys((manager as any).rejectors).length).toBe(1);
      middleware({ dispatch, getState })(next)(resetAction);

      expect(next).toHaveBeenCalled();

      await expect(promise).rejects.toBeDefined();
      expect(rejection).toBeDefined();

      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});

describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RIC = require('../RIC').default;
    const fn = jest.fn();
    jest.useFakeTimers();
    RIC(fn, {});
    jest.runAllTimers();
    expect(fn).toBeCalled();
    (global as any).requestIdleCallback = requestIdle;
  });
});
