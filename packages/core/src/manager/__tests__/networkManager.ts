import { Endpoint } from '@data-client/endpoint';
import { Article, ArticleResource } from '__tests__/new';

import { SET_RESPONSE } from '../../actionTypes';
import { createFetch, createReset } from '../../controller/actions';
import Controller from '../../controller/Controller';
import initManager from '../../manager/initManager';
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
    (fetchRejectAction.meta.promise as any).catch((e: unknown) => {});

    let NM: NetworkManager;
    beforeEach(() => {
      NM = new NetworkManager({ dataExpiryLength: 42, errorExpiryLength: 7 });
    });
    afterEach(() => {
      NM.cleanup();
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
});

describe('NetworkManager while the controller awaits init()', () => {
  function bind(dispatch: jest.Mock): Controller {
    const controller = new Controller({
      dispatch,
      getState: () => initialState,
    });
    controller.awaitingInit = true;
    return controller;
  }

  function counted(settle: () => Promise<unknown>, sideEffect?: true) {
    let calls = 0;
    const endpoint = new Endpoint(
      () => {
        calls += 1;
        return settle();
      },
      { name: 'counted', sideEffect },
    );
    return { endpoint, getCalls: () => calls };
  }

  async function start(
    nm: NetworkManager,
    endpoint: ReturnType<typeof counted>['endpoint'],
    controller: Controller,
  ) {
    const action = createFetch(endpoint, { args: [] });
    void Promise.resolve(action.meta.promise).catch(() => {});
    await Promise.resolve(
      nm.middleware(controller)(() => Promise.resolve())(action),
    );
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  function commit(nm: NetworkManager, controller: Controller) {
    initManager([nm], controller, initialState)();
  }

  it('resolves immediately when nothing awaits init()', async () => {
    const { endpoint } = counted(() => Promise.resolve(5));
    const dispatch = jest.fn(() => Promise.resolve());
    const nm = new NetworkManager();
    await start(
      nm,
      endpoint,
      new Controller({ dispatch, getState: () => initialState }),
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    nm.cleanup();
  });

  it('parks a response until init(), then publishes it from a microtask', async () => {
    const { endpoint, getCalls } = counted(() => Promise.resolve(5));
    const dispatch = jest.fn((_action: SetResponseAction) => Promise.resolve());
    const controller = bind(dispatch);
    const nm = new NetworkManager();
    await start(nm, endpoint, controller);
    expect(dispatch).not.toHaveBeenCalled();
    commit(nm, controller);
    expect(dispatch).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toMatchObject({
      type: SET_RESPONSE,
      response: 5,
      error: false,
    });
    nm.init();
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(getCalls()).toBe(1);
    nm.cleanup();
  });

  it('publishes into the controller bound when init() runs', async () => {
    const failure = new Error('nope');
    const { endpoint, getCalls } = counted(() => Promise.reject(failure));
    const discarded = jest.fn((_action: SetResponseAction) =>
      Promise.resolve(),
    );
    const committed = jest.fn((_action: SetResponseAction) =>
      Promise.resolve(),
    );
    const nm = new NetworkManager();
    await start(nm, endpoint, bind(discarded));
    const controller = bind(committed);
    nm.middleware(controller);
    commit(nm, controller);
    await Promise.resolve();
    expect(discarded).not.toHaveBeenCalled();
    expect(committed).toHaveBeenCalledTimes(1);
    expect(committed.mock.calls[0][0]).toMatchObject({
      type: SET_RESPONSE,
      response: failure,
      error: true,
    });
    expect(getCalls()).toBe(1);
    nm.cleanup();
  });

  it('does not park mutations', async () => {
    const { endpoint } = counted(() => Promise.resolve(5), true);
    const dispatch = jest.fn(() => Promise.resolve());
    const nm = new NetworkManager();
    await start(nm, endpoint, bind(dispatch));
    expect(dispatch).toHaveBeenCalledTimes(1);
    nm.cleanup();
  });

  it('drops a parked result on RESET', async () => {
    const { endpoint } = counted(() => Promise.resolve(5));
    const dispatch = jest.fn(() => Promise.resolve());
    const controller = bind(dispatch);
    const nm = new NetworkManager();
    await start(nm, endpoint, controller);
    await nm.middleware(controller)(() => Promise.resolve())(createReset());
    commit(nm, controller);
    await Promise.resolve();
    expect(dispatch).not.toHaveBeenCalled();
    nm.cleanup();
  });
});
