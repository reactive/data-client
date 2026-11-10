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
  const error = new Error('network down');
  const rejectingController = () =>
    new Controller({
      dispatch: (action: any) => {
        action.meta.reject(error);
        return Promise.resolve();
      },
      getState: () => initialState,
    });

  it('warns when dispatching during middleware setup', () => {
    const controller = new Controller();
    expect(() =>
      controller.fetch(CoolerArticleResource.get, { id: 5 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch."`,
    );
  });

  describe('fetch', () => {
    const reads = [
      ['with a schema', CoolerArticleResource.get],
      [
        'without a schema',
        CoolerArticleResource.get.extend({ schema: undefined }),
      ],
    ] as const;

    it.each(reads)('read %s rejects when awaited', async (_, endpoint) => {
      await expect(
        rejectingController().fetch(endpoint, { id: 5 }),
      ).rejects.toBe(error);
    });

    // jest fails the running test on an unhandled rejection
    it.each(reads)(
      'read %s is not an unhandled rejection when not awaited',
      async (_, endpoint) => {
        rejectingController().fetch(endpoint, { id: 5 });
        await new Promise(resolve => setTimeout(resolve, 10));
      },
    );

    it('mutation leaves its rejection to the caller', async () => {
      // jest fails the test on any unhandled rejection, so check that nothing handles it instead
      const catchSpy = jest.spyOn(Promise.prototype, 'catch');
      let promise: Promise<unknown>;
      try {
        promise = rejectingController().fetch(
          CoolerArticleResource.update,
          { id: 5 },
          { title: 'hi' },
        );
        expect(catchSpy.mock.contexts).not.toContain(promise);
      } finally {
        catchSpy.mockRestore();
      }
      await expect(promise).rejects.toBe(error);
    });
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
    const key = CoolerArticleResource.get.key({ id: 5 });
    describe.each([
      ['the fetch fails', rejectingController],
      [
        'the latest fetch failed within errorExpiryLength',
        () =>
          new Controller({
            dispatch: () => {
              throw new Error('should not fetch');
            },
            getState: () => ({
              ...initialState,
              meta: {
                [key]: {
                  date: Date.now(),
                  fetchedAt: Date.now(),
                  expiresAt: Date.now() + 10000,
                  error,
                },
              },
            }),
          }),
      ],
    ])('when %s', (_, makeController) => {
      it('rejects when awaited', async () => {
        await expect(
          makeController().fetchIfStale(CoolerArticleResource.get, { id: 5 }),
        ).rejects.toBe(error);
      });

      // jest fails the running test on an unhandled rejection
      it('is not an unhandled rejection when not awaited', async () => {
        makeController().fetchIfStale(CoolerArticleResource.get, { id: 5 });
        await new Promise(resolve => setTimeout(resolve, 10));
      });
    });
  });
});
