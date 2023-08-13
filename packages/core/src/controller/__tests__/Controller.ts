import { Endpoint, Entity } from '@data-client/endpoint';
import { normalize } from '@data-client/normalizr';
import { CoolerArticleResource } from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';

import { ExpiryStatus } from '../..';
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
        payload,
        CoolerArticleResource.get.schema,
      );
      const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
      const state = {
        ...initialState,
        entities,
        results: {
          [fetchKey]: result,
        },
        entityMeta: createEntityMeta(entities),
        meta: {
          [fetchKey]: {
            date: Date.now(),
            expiresAt: Date.now() + 10000,
          },
        },
      };
      const getState = () => state;
      const controller = new Controller({
        dispatch: jest.fn(() => Promise.resolve()),
        getState,
      });
      const article = await controller.fetchIfStale(CoolerArticleResource.get, {
        id: payload.id,
      });
      expect(controller.dispatch.mock.calls.length).toBe(0);
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
        payload,
        CoolerArticleResource.get.schema,
      );
      const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
      const state = {
        ...initialState,
        entities,
        results: {
          [fetchKey]: result,
        },
        entityMeta: createEntityMeta(entities),
        meta: {
          [fetchKey]: {
            date: 0,
            expiresAt: 0,
          },
        },
      };
      const getState = () => state;
      const controller = new Controller({
        dispatch: jest.fn(() => Promise.resolve()),
        getState,
      });
      controller.fetchIfStale(CoolerArticleResource.get, {
        id: payload.id,
      });

      expect(controller.dispatch.mock.calls.length).toBe(1);
    });
  });
});
