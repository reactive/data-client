import { ArticleResource } from '__tests__/legacy-3';

import { Middleware } from '../../types';
import Controller from '../../controller/Controller';
import NetworkManager from '../NetworkManager';
import { FetchAction } from '../../types';
import { RECEIVE_TYPE } from '../../actionTypes';
import { createFetch } from '../actions';
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
    const detailShape = ArticleResource.detailShape();
    detailShape.fetch = () => Promise.resolve({ id: 5, title: 'hi' });
    const fetchResolveAction = createFetch(detailShape, {
      params: { id: 5 },
      throttle: false,
    });

    const updaters = {
      [ArticleResource.listShape().getFetchKey({})]:
        () => (result: string[], oldResults: string[] | undefined) =>
          [...(oldResults || []), result] as any,
    };
    const fetchReceiveWithUpdatersAction: FetchAction = {
      ...fetchResolveAction,
      meta: {
        ...fetchResolveAction.meta,
        updaters,
      },
    };

    const updateShape = ArticleResource.updateShape();
    updateShape.fetch = (params, body) => Promise.resolve(body);
    const fetchRpcWithUpdatersAction = createFetch(updateShape, {
      params: { id: 5 },
      body: { id: 5, title: 'hi' },
      throttle: false,
      updateParams: [
        [
          ArticleResource.listShape(),
          {},
          () => (result: string[], oldResults: string[] | undefined) =>
            [...(oldResults || []), result],
        ],
      ],
    });
    const partialUpdateShape = ArticleResource.partialUpdateShape();
    partialUpdateShape.fetch = (params, body) => Promise.resolve(body);
    const fetchRpcWithUpdatersAndOptimisticAction = createFetch(
      partialUpdateShape,
      {
        params: { id: 5 },
        body: { id: 5, title: 'hi' },
        throttle: false,
        updateParams: [
          [
            ArticleResource.listShape(),
            {},
            () => (result: string[], oldResults: string[] | undefined) =>
              [...(oldResults || []), result],
          ],
        ],
      },
    );

    const errorUpdateShape = ArticleResource.updateShape();
    errorUpdateShape.fetch = () => Promise.reject(new Error('Failed'));
    const fetchRejectAction = createFetch(errorUpdateShape, {
      params: { id: 5 },
      body: { id: 5, title: 'hi' },
      throttle: false,
    });
    (fetchRejectAction.meta.promise as any).catch(e => {});

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

      const action = {
        type: RECEIVE_TYPE,
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

      const action = {
        type: RECEIVE_TYPE,
        payload: data,
        meta: {
          updaters: {
            [ArticleResource.listShape().getFetchKey({})]: expect.any(Function),
          },
          args: fetchReceiveWithUpdatersAction.meta.args,
          update: fetchReceiveWithUpdatersAction.meta.update,
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

      const action = {
        type: RECEIVE_TYPE,
        payload: data,
        meta: {
          updaters: undefined,
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
      expect(dispatch).toHaveBeenCalledWith({
        type: RECEIVE_TYPE,
        payload: data,
        meta: {
          updaters: undefined,
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
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });

      middleware({ dispatch, getState, controller })(() => Promise.resolve())({
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
