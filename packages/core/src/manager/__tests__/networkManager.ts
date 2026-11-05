import { Endpoint } from '@data-client/endpoint';
import { Article, ArticleResource } from '__tests__/new';

import { RESET, SET_RESPONSE } from '../../actionTypes';
import { createFetch } from '../../controller/actions';
import Controller from '../../controller/Controller';
import NetworkManager from '../../manager/NetworkManager';
import { initialState } from '../../state/reducer/createReducer';
import { Middleware, SetResponseAction } from '../../types';

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  const getState = () => initialState;

  afterAll(() => {
    manager.cleanup();
  });
  let errorspy: jest.SpyInstance;
  beforeEach(() => {
    errorspy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('getState() should have initialState before middleware run', () => {
    class Hacked extends NetworkManager {
      getHacked() {
        return this.controller.getState();
      }
    }
    const hacked = new Hacked();
    expect(hacked.getHacked()).toEqual(initialState);
  });

  describe('middleware', () => {
    it('should return the same value every call', () => {
      const a = manager.middleware;
      expect(a).toBe(manager.middleware);
    });
    it('should return the different value for a different instance', () => {
      const a = manager.middleware;
      const manager2 = new NetworkManager();
      const a2 = manager2.middleware;
      expect(a).not.toBe(a2);
      expect(a2).toBe(manager2.middleware);
      manager2.cleanup();
    });
  });

  describe('middleware', () => {
    const detailEndpoint = new Endpoint(
      (v: { id: number }) => Promise.resolve({ id: 5, title: 'hi' }),
      {
        schema: Article,
        name: 'detailEndpoint',
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
    const fetchSetWithUpdatersAction = createFetch(detailWithUpdaterEndpoint, {
      args: [{ id: 5 }],
    });

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
    fetchRejectAction.meta.promise.catch(() => {});

    let NM: NetworkManager;
    beforeEach(() => {
      NM = new NetworkManager({ dataExpiryLength: 42, errorExpiryLength: 7 });
    });
    afterEach(() => {
      NM.cleanup();
    });

    it('meta.promise is a Promise managers can chain with finally()', async () => {
      const action = createFetch(detailEndpoint, { args: [{ id: 5 }] });
      const done = action.meta.promise.finally(() => {});
      action.meta.resolve('result');
      await expect(done).resolves.toBe('result');
    });

    it('should handle fetch actions and dispatch on success', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(next)(fetchResolveAction);

      const response = await fetchResolveAction.endpoint(
        ...fetchResolveAction.args,
      );

      // mutations resolve before dispatch, so we must wait for next tick to see set
      await new Promise(resolve => setTimeout(resolve, 0));

      const action: SetResponseAction = {
        type: SET_RESPONSE,
        endpoint: fetchResolveAction.endpoint,
        response,
        args: fetchResolveAction.args,
        key: fetchResolveAction.key,
        error: expect.anything(),
        meta: {
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      };
      expect(dispatch).toHaveBeenCalledWith(action);
      expect(next).not.toHaveBeenCalledWith(action);
    });
    it('should handle fetch set action and dispatch on success with updaters', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(next)(fetchSetWithUpdatersAction);

      const response = await fetchSetWithUpdatersAction.endpoint(
        ...fetchSetWithUpdatersAction.args,
      );

      // mutations resolve before dispatch, so we must wait for next tick to see set
      await new Promise(resolve => setTimeout(resolve, 0));

      const action: SetResponseAction = {
        type: SET_RESPONSE,
        endpoint: fetchSetWithUpdatersAction.endpoint,
        response,
        args: fetchSetWithUpdatersAction.args,
        key: fetchSetWithUpdatersAction.key,
        error: expect.anything(),
        meta: {
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
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(next)(fetchRpcWithUpdatersAction);

      const response = await fetchRpcWithUpdatersAction.endpoint(
        ...fetchRpcWithUpdatersAction.args,
      );

      // mutations resolve before dispatch, so we must wait for next tick to see set
      await new Promise(resolve => setTimeout(resolve, 0));

      const action: SetResponseAction = {
        type: SET_RESPONSE,
        endpoint: fetchRpcWithUpdatersAction.endpoint,
        response,
        args: fetchRpcWithUpdatersAction.args,
        key: fetchRpcWithUpdatersAction.key,
        error: expect.anything(),
        meta: {
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
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(next)(fetchRpcWithUpdatersAndOptimisticAction);

      const response = await fetchRpcWithUpdatersAndOptimisticAction.endpoint(
        ...fetchRpcWithUpdatersAndOptimisticAction.args,
      );

      expect(next).toHaveBeenCalled();
      // mutations resolve before dispatch, so we must wait for next tick to see set
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(dispatch).toHaveBeenCalledWith({
        type: SET_RESPONSE,
        endpoint: fetchRpcWithUpdatersAndOptimisticAction.endpoint,
        response,
        args: fetchRpcWithUpdatersAndOptimisticAction.args,
        key: fetchRpcWithUpdatersAndOptimisticAction.key,
        error: expect.anything(),
        meta: {
          date: expect.any(Number),
          expiresAt: expect.any(Number),
          fetchedAt: expect.any(Number),
        },
      });
    });
    it('should use dataExpireLength from action if specified', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(() => Promise.resolve())({
        ...fetchResolveAction,
        endpoint: detailEndpoint.extend({ dataExpiryLength: 314 }),
      });

      await fetchResolveAction.endpoint(...fetchResolveAction.args);

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(314);
    });
    it('should use dataExpireLength from NetworkManager if not specified in action', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      NM.middleware(API)(() => Promise.resolve())({
        ...fetchResolveAction,
        endpoint: detailEndpoint.extend({ dataExpiryLength: undefined }),
      });

      await fetchResolveAction.endpoint(...fetchResolveAction.args);

      expect(dispatch).toHaveBeenCalled();
      const { meta } = dispatch.mock.calls[0][0];
      expect(meta.expiresAt - meta.date).toBe(60000);
    });
    it('should handle fetch actions and dispatch on error', async () => {
      const next = jest.fn();
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      try {
        await NM.middleware(API)(next)(fetchRejectAction);
      } catch (error) {
        expect(next).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
          type: SET_RESPONSE,
          response: error,
          key: fetchRejectAction.key,
          meta: {
            date: expect.any(Number),
            expiresAt: expect.any(Number),
          },
          error: true,
        });
      }
    });
    it('should use errorExpireLength from action if specified', async () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      try {
        await NM.middleware(API)(() => Promise.resolve())({
          ...fetchRejectAction,
          meta: {
            ...fetchRejectAction.meta,
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
      const controller = new Controller({ dispatch, getState });
      const API: Controller & { controller: Controller } = Object.create(
        controller,
        {
          controller: { value: controller },
        },
      );

      try {
        await NM.middleware(API)(() => Promise.resolve())({
          ...fetchRejectAction,
          meta: {
            ...fetchRejectAction.meta,
          },
        });
      } catch (error) {
        expect(dispatch).toHaveBeenCalled();
        const { meta } = dispatch.mock.calls[0][0];
        expect(meta.expiresAt - meta.date).toBe(7);
      }
    });
  });

  describe('remounted provider', () => {
    const endpoint = new Endpoint(
      (v: { id: number }) => Promise.resolve({ id: v.id, title: 'hi' }),
      { schema: Article, name: 'remountEndpoint' },
    );
    const bind = (mgr: NetworkManager) => {
      const dispatch = jest.fn((_action: any) => Promise.resolve());
      const controller = new Controller({ dispatch, getState });
      const next = jest.fn((_action: any) => Promise.resolve());
      return { dispatch, next, handle: mgr.middleware(controller)(next) };
    };

    it('sends a fetch from a replaced store without writing it to the new one', async () => {
      const mgr = new NetworkManager();
      const old = bind(mgr);
      const current = bind(mgr);
      const action = createFetch(endpoint, { args: [{ id: 5 }] });

      await old.handle(action);
      await expect(action.meta.promise).resolves.toEqual({
        id: 5,
        title: 'hi',
      });
      expect(old.dispatch).not.toHaveBeenCalled();
      expect(current.dispatch).not.toHaveBeenCalled();
      expect(mgr.allSettled()).toBeUndefined();
    });

    it("ignores a replaced store's reset", async () => {
      const mgr = new NetworkManager();
      const old = bind(mgr);
      const current = bind(mgr);
      const action = createFetch(endpoint, { args: [{ id: 5 }] });
      current.handle(action);

      const reset = { type: RESET, date: Date.now() } as const;
      await old.handle(reset);
      expect(old.next).toHaveBeenCalledWith(reset);
      // the bound store's fetch is still in flight
      expect(mgr.allSettled()).toBeDefined();
      mgr.cleanup();
    });

    it('does not settle a fetch with a response to an older one', async () => {
      const mgr = new NetworkManager();
      const { handle } = bind(mgr);
      const action = createFetch(endpoint, { args: [{ id: 5 }] });
      handle(action);
      const settled = jest.fn();
      action.meta.promise.then(settled, settled);

      await handle({
        type: SET_RESPONSE,
        key: action.key,
        endpoint,
        args: [{ id: 5 }],
        response: { id: 5, title: 'old' },
        meta: {
          fetchedAt: action.meta.fetchedAt - 1,
          date: 0,
          expiresAt: 0,
        },
      } as SetResponseAction);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(settled).not.toHaveBeenCalled();
      mgr.cleanup();
    });
  });
});
