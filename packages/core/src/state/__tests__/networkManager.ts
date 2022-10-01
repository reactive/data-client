import { Article, ArticleResource } from '__tests__/new';
import { Endpoint } from '@rest-hooks/endpoint';

import { Middleware } from '../../types';
import Controller from '../../controller/Controller';
import NetworkManager from '../NetworkManager';
import { FetchAction } from '../../types';
import { RECEIVE_TYPE } from '../../actionTypes';
import createFetch from '../../controller/createFetch';
import { initialState } from '../createReducer';

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  const getState = () => initialState;

  afterAll(() => {
    manager.cleanup();
  });
  let errorspy: jest.SpyInstance;
  beforeEach(() => {
    errorspy = jest.spyOn(global.console, 'error');
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('getState() should have initialState before middleware run', () => {
    class Hacked extends NetworkManager {
      getHacked() {
        return this.getState();
      }
    }
    const hacked = new Hacked();
    expect(hacked.getHacked()).toEqual(initialState);
  });

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
      manager2.cleanup();
    });
  });

  describe('middleware', () => {
    const detailEndpoint = new Endpoint(
      (v: { id: number }) => Promise.resolve({ id: 5, title: 'hi' }),
      {
        schema: Article,
      },
    );
    const fetchResolveAction = createFetch(detailEndpoint, {
      args: [{ id: 5 }],
    });

    const detailWithUpdaterEndpoint = detailEndpoint.extend({
      update(id: string, v: { id: number }) {
        const updates = {
          [ArticleResource.getList.key({})]: (oldResults = []) => [
            ...(oldResults || []),
            id,
          ],
        };
        return updates;
      },
    });
    const fetchReceiveWithUpdatersAction: FetchAction = createFetch(
      detailWithUpdaterEndpoint,
      {
        args: [{ id: 5 }],
      },
    );

    const updateShape = new Endpoint(
      (params: any, body: any) => Promise.resolve(body),
      {
        schema: Article,
        sideEffect: true,
        key: ArticleResource.update.key.bind(ArticleResource.partialUpdate),
        update(id: string, params: any, body: any) {
          const updates = {
            [ArticleResource.getList.key({})]: (oldResults = []) => [
              ...(oldResults || []),
              id,
            ],
          };
          return updates;
        },
      },
    );
    const fetchRpcWithUpdatersAction = createFetch(updateShape, {
      args: [{ id: 5 }, { id: 5, title: 'hi' }],
    });
    const partialUpdateShape = new Endpoint(
      (params, body) => Promise.resolve(body),
      {
        getOptimisticResponse:
          ArticleResource.partialUpdate.getOptimisticResponse,
        schema: Article,
        key: ArticleResource.partialUpdate.key.bind(
          ArticleResource.partialUpdate,
        ),
        sideEffect: true,
        update(id: string, params: any, body: any) {
          const updates = {
            [ArticleResource.getList.key({})]: (oldResults = []) => [
              ...(oldResults || []),
              id,
            ],
          };
          return updates;
        },
      },
    );
    const fetchRpcWithUpdatersAndOptimisticAction = createFetch(
      partialUpdateShape,
      {
        args: [{ id: 5 }, { id: 5, title: 'hi' }],
      },
    );

    const errorUpdateShape = ArticleResource.update;
    errorUpdateShape.fetch = () => Promise.reject(new Error('Failed'));
    const fetchRejectAction = createFetch(errorUpdateShape, {
      args: [{ id: 5 }, { id: 5, title: 'hi' }],
    });
    (fetchRejectAction.meta.promise as any).catch((e: unknown) => {});

    let NM: NetworkManager;
    let middleware: Middleware;
    beforeEach(() => {
      NM = new NetworkManager(42, 7);
      middleware = NM.getMiddleware();
    });
    afterEach(() => {
      NM.cleanup();
    });

    it('should handle fetch actions and dispatch on success', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(next)(fetchResolveAction);

      const data = await fetchResolveAction.payload();

      // mutations resolve before dispatch, so we must wait for next tick to see receive
      await new Promise(resolve => setTimeout(resolve, 0));

      const action = {
        type: RECEIVE_TYPE,
        endpoint: fetchResolveAction.endpoint,
        payload: data,
        meta: {
          schema: fetchResolveAction.meta.schema,
          args: fetchResolveAction.meta.args,
          update: fetchResolveAction.meta.update,
          key: fetchResolveAction.meta.key,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      };
      expect(dispatch).toHaveBeenCalledWith(action);
      expect(next).not.toHaveBeenCalledWith(action);
    });
    it('should handle fetch receive action and dispatch on success with updaters', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(next)(
        fetchReceiveWithUpdatersAction,
      );

      const data = await fetchReceiveWithUpdatersAction.payload();

      // mutations resolve before dispatch, so we must wait for next tick to see receive
      await new Promise(resolve => setTimeout(resolve, 0));

      const action = {
        type: RECEIVE_TYPE,
        endpoint: fetchReceiveWithUpdatersAction.endpoint,
        payload: data,
        meta: {
          update: expect.any(Function),
          args: fetchReceiveWithUpdatersAction.meta.args,
          schema: fetchReceiveWithUpdatersAction.meta.schema,
          key: fetchReceiveWithUpdatersAction.meta.key,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      };
      expect(dispatch).toHaveBeenCalledWith(action);
      expect(next).not.toHaveBeenCalledWith(action);
    });
    it('should handle fetch rpc action and dispatch on success with updaters', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(next)(
        fetchRpcWithUpdatersAction,
      );

      const data = await fetchRpcWithUpdatersAction.payload();

      // mutations resolve before dispatch, so we must wait for next tick to see receive
      await new Promise(resolve => setTimeout(resolve, 0));

      const action = {
        type: RECEIVE_TYPE,
        endpoint: fetchRpcWithUpdatersAction.endpoint,
        payload: data,
        meta: {
          args: fetchRpcWithUpdatersAction.meta.args,
          update: expect.any(Function),
          schema: fetchRpcWithUpdatersAction.meta.schema,
          key: fetchRpcWithUpdatersAction.meta.key,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      };
      expect(dispatch).toHaveBeenCalledWith(action);
      expect(next).not.toHaveBeenCalledWith(action);
    });
    it('should handle fetch rpc action with optimistic response and dispatch on success with updaters', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(next)(
        fetchRpcWithUpdatersAndOptimisticAction,
      );

      const data = await fetchRpcWithUpdatersAndOptimisticAction.payload();

      expect(next).toHaveBeenCalled();
      // mutations resolve before dispatch, so we must wait for next tick to see receive
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(dispatch).toHaveBeenCalledWith({
        type: RECEIVE_TYPE,
        endpoint: fetchRpcWithUpdatersAndOptimisticAction.endpoint,
        payload: data,
        meta: {
          args: fetchRpcWithUpdatersAndOptimisticAction.meta.args,
          update: expect.any(Function),
          schema: fetchRpcWithUpdatersAndOptimisticAction.meta.schema,
          key: fetchRpcWithUpdatersAndOptimisticAction.meta.key,
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      });
    });
    it('should use dataExpireLength from action if specified', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(() => Promise.resolve())({
        ...fetchResolveAction,
        endpoint: detailEndpoint.extend({ dataExpiryLength: 314 }),
      });

      await fetchResolveAction.payload();

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(314);
    });
    it('should use dataExpireLength from NetworkManager if not specified in action', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(() => Promise.resolve())({
        ...fetchResolveAction,
        endpoint: detailEndpoint.extend({ dataExpiryLength: undefined }),
      });

      await fetchResolveAction.payload();

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(60000);
    });
    it('should handle fetch actions and dispatch on error', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      try {
        await middleware({ dispatch, getState, controller })(next)(
          fetchRejectAction,
        );
      } catch (error) {
        expect(next).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
          type: RECEIVE_TYPE,
          payload: error,
          meta: {
            schema: fetchRejectAction.meta.schema,
            key: fetchRejectAction.meta.key,
            date: expect.any(Number),
            expiresAt: expect.any(Number),
          },
          error: true,
        });
      }
    });
    it('should use errorExpireLength from action if specified', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      try {
        await middleware({ dispatch, getState, controller })(() =>
          Promise.resolve(),
        )({
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
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      try {
        await middleware({ dispatch, getState, controller })(() =>
          Promise.resolve(),
        )({
          ...fetchRejectAction,
          meta: {
            ...fetchRejectAction.meta,
            options: {
              ...fetchRejectAction.meta.options,
              errorExpiryLength: undefined,
            },
          },
        });
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(7);
      }
    });

    it('getLastReset() should handle Date object', async () => {
      const mgr = new NetworkManager();
      jest.spyOn(mgr, 'getState' as any).mockImplementation((): any => ({
        ...initialState,
        lastReset: new Date(0),
      }));

      expect((mgr as any).getLastReset()).toBeLessThan(Date.now());
    });

    it('getLastReset() should handle null', async () => {
      const mgr = new NetworkManager();
      jest.spyOn(mgr, 'getState' as any).mockImplementation((): any => ({
        ...initialState,
        lastReset: null,
      }));

      expect((mgr as any).getLastReset()).toBeLessThan(Date.now());
    });
  });
});
