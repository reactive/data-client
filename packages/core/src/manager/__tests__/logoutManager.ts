import { CoolerArticleResource } from '__tests__/new';

import { Controller, initialState } from '../..';
import { FETCH, RESET } from '../../actionTypes';
import { createSetResponse } from '../../controller/actions';
import LogoutManager from '../LogoutManager.js';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

describe('LogoutManager', () => {
  const manager = new LogoutManager();
  const getState = () => initialState;

  describe('middleware', () => {
    it('should return the same value every call', () => {
      const a = manager.middleware;
      expect(a).toBe(manager.middleware);
    });
  });

  describe('middleware', () => {
    afterEach(() => {
      jest.useRealTimers();
    });
    const next = jest.fn();
    const dispatch = jest.fn(action => Promise.resolve());
    const controller = new Controller({ dispatch, getState });
    const API: Controller & { controller: Controller } = Object.create(
      controller,
      {
        controller: { value: controller },
      },
    );
    it('should ignore non-error set', async () => {
      const action = createSetResponse(CoolerArticleResource.get, {
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi' },
      });
      await manager.middleware(API)(next)(action);

      expect(dispatch.mock.calls.length).toBe(0);
    });
    it('should ignore non-401 set', async () => {
      const error: any = new Error('network failed');
      error.status = 404;
      const action = createSetResponse(CoolerArticleResource.get, {
        args: [{ id: 5 }],
        response: error,
        error: true,
      });
      await manager.middleware(API)(next)(action);

      expect(dispatch.mock.calls.length).toBe(0);
    });
    it('should dispatch reset on 401', async () => {
      const error: any = new Error('network failed');
      error.status = 401;
      const action = createSetResponse(CoolerArticleResource.get, {
        args: [{ id: 5 }],
        response: error,
        error: true,
      });
      await manager.middleware(API)(next)(action);

      expect(dispatch.mock.calls.length).toBe(1);
      expect(dispatch.mock.calls[0][0]?.type).toBe(RESET);
    });

    it('should call custom handleLogout', async () => {
      const handleLogout = jest.fn((controller: Controller) => {});
      const localMiddleware = new LogoutManager({
        shouldLogout(error) {
          return error.status === 403;
        },
        handleLogout,
      }).middleware;
      const error: any = new Error('network failed');
      error.status = 403;
      const action = createSetResponse(CoolerArticleResource.get, {
        args: [{ id: 5 }],
        response: error,
        error: true,
      });
      await localMiddleware(API)(next)(action);

      expect(handleLogout.mock.calls.length).toBe(1);
    });

    it('should let other actions pass through', async () => {
      const action = { type: FETCH };
      next.mockReset();

      await manager.middleware(API)(next)(action as any);

      expect(next.mock.calls.length).toBe(1);
    });
  });
});
