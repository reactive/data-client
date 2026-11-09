import { normalize } from '@data-client/normalizr';
import { CoolerArticleResource } from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';

import createReducer, { initialState } from '../../state/reducer/createReducer';
import type { State } from '../../types';
import { createFetch, createSetResponse } from '../actions';
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

  describe('snapshot', () => {
    const Article = CoolerArticleResource.get.schema;
    let getOptimisticResponse: jest.Mock;
    let controller: Controller;
    let state: State<unknown>;

    beforeEach(() => {
      getOptimisticResponse = jest.fn((snap, params, body) => ({
        ...params,
        ...body,
      }));
      controller = new Controller({ getState: () => state });
      const reducer = createReducer(controller);
      state = reducer(
        initialState,
        createSetResponse(CoolerArticleResource.get, {
          args: [{ id: 5 }],
          response: { id: 5, title: 'saved' },
        }),
      );
      state = reducer(
        state,
        createFetch(
          CoolerArticleResource.partialUpdate.extend({ getOptimisticResponse }),
          { args: [{ id: 5 }, { title: 'optimistic' }] },
        ),
      );
    });

    it('includes pending optimistic updates', () => {
      expect(controller.snapshot().get(Article, { id: 5 })?.title).toBe(
        'optimistic',
      );
      expect(
        controller.snapshot(controller.getState()).get(Article, { id: 5 })
          ?.title,
      ).toBe('optimistic');
      // getState(), which Managers read, leaves them out
      expect(controller.getState().optimistic).toHaveLength(1);
    });

    it('applies optimistic updates once per state', () => {
      const article = controller.snapshot().get(Article, { id: 5 });
      // like the state components render, which has them applied already
      const rendered = controller.applyOptimistic(state);
      expect(controller.snapshot(rendered).get(Article, { id: 5 })).toBe(
        article,
      );
      expect(controller.snapshot().get(Article, { id: 5 })).toBe(article);
      expect(getOptimisticResponse).toHaveBeenCalledTimes(1);
    });

    it('getOptimisticResponse() reads the committed state through snapshot()', () => {
      getOptimisticResponse.mockImplementation((snap, params, body) => ({
        ...params,
        title: `${controller.snapshot().get(Article, params)?.title} ${body.title}`,
      }));
      expect(controller.snapshot().get(Article, { id: 5 })?.title).toBe(
        'saved optimistic',
      );
    });

    it('applyOptimistic() returns the state itself when nothing is pending', () => {
      const committed = { ...state, optimistic: [] };
      expect(controller.applyOptimistic(committed)).toBe(committed);
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
      const article = await controller.fetchIfStale(CoolerArticleResource.get, {
        id: payload.id,
      });
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
  });
});
