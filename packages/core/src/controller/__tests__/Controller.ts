import { normalize } from '@data-client/normalizr';
import { CoolerArticleResource } from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';

import { initialState } from '../../state/reducer/createReducer';
import Controller from '../Controller';

function ignoreError(e: Event) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', ignoreError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', ignoreError);
});

describe('Controller', () => {
  it('warns when dispatching during middleware setup', () => {
    const controller = new Controller();
    expect(() =>
      controller.fetch(CoolerArticleResource.get, { id: 5 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch."`,
    );
  });

  describe('fetchIfStale', () => {
    it('should NOT fetch if result is NOT stale', async () => {
      const payload = {
        id: 5,
        title: 'hi ho',
        content: 'whatever',
        tags: ['a', 'best', 'react'],
      };
      const { entities, result } = normalize(
        CoolerArticleResource.get.schema,
        payload,
      );
      const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
      const state = {
        ...initialState,
        entities,
        endpoints: {
          [fetchKey]: result,
        },
        entitiesMeta: createEntityMeta(entities),
        meta: {
          [fetchKey]: {
            date: Date.now(),
            fetchedAt: Date.now(),
            expiresAt: Date.now() + 10000,
          },
        },
      };
      const getState = () => state;
      const dispatch = jest.fn(() => Promise.resolve());
      const controller = new Controller({
        dispatch,
        getState,
      });
      const pending = controller.fetchIfStale(CoolerArticleResource.get, {
        id: payload.id,
      });
      // fresh data still comes as a Promise, so prefetch code can chain .catch()
      expect(() => pending.catch(() => {})).not.toThrow();
      const article = await pending;
      expect(dispatch.mock.calls.length).toBe(0);
      expect(article.title).toBe(payload.title);
    });
    it('should fetch if result stale', () => {
      const payload = {
        id: 5,
        title: 'hi ho',
        content: 'whatever',
        tags: ['a', 'best', 'react'],
      };
      const { entities, result } = normalize(
        CoolerArticleResource.get.schema,
        payload,
      );
      const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
      const state = {
        ...initialState,
        entities,
        endpoints: {
          [fetchKey]: result,
        },
        entitiesMeta: createEntityMeta(entities),
        meta: {
          [fetchKey]: {
            date: 0,
            fetchedAt: 0,
            expiresAt: 0,
          },
        },
      };
      const getState = () => state;
      const dispatch = jest.fn(() => Promise.resolve());
      const controller = new Controller({
        dispatch,
        getState,
      });
      controller.fetchIfStale(CoolerArticleResource.get, {
        id: payload.id,
      });

      expect(dispatch.mock.calls.length).toBe(1);
    });
    describe('when the fetch fails', () => {
      const error = new Error('network down');
      const controller = new Controller({
        dispatch: (action: any) => {
          action.meta.reject(error);
          return Promise.resolve();
        },
        getState: () => initialState,
      });

      it('rejects when awaited', async () => {
        await expect(
          controller.fetchIfStale(CoolerArticleResource.get, { id: 5 }),
        ).rejects.toBe(error);
      });

      it('is not an unhandled rejection when not awaited', async () => {
        const unhandled = jest.fn();
        process.on('unhandledRejection', unhandled);
        try {
          controller.fetchIfStale(CoolerArticleResource.get, { id: 5 });
          // unhandledRejection fires after the microtask queue drains
          await new Promise(resolve => setTimeout(resolve, 10));
        } finally {
          process.off('unhandledRejection', unhandled);
        }
        expect(unhandled).not.toHaveBeenCalled();
      });
    });
  });
});
