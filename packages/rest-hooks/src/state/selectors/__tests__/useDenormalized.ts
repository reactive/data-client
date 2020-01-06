import { renderHook } from '@testing-library/react-hooks';
import {
  CoolerArticleResource,
  PaginatedArticleResource,
  NestedArticleResource,
  UserResource,
} from '__tests__/common';

import { normalize } from '../../../resource';
import useDenormalized from '../useDenormalized';

describe('useDenormalized()', () => {
  describe('Single', () => {
    const params = { id: 5, title: 'bob', content: 'head' };
    const article = CoolerArticleResource.fromJS(params);
    describe('state is empty', () => {
      const state = { entities: {}, results: {}, meta: {} };
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), { id: 5 }, state),
      );

      it('found should be false', () => {
        expect(result.current[1]).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current[0]).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('state is populated just not with our query', () => {
      const state = {
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useDenormalized(
          CoolerArticleResource.detailShape(),
          {
            id: 543345345345453,
          },
          state,
        ),
      );

      it('found should be false', () => {
        expect(result.current[1]).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(result.current[0]).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('when state exists', () => {
      const state = {
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toBe(article);
      });
    });
    describe('without entity with defined results', () => {
      const state = {
        entities: { [CoolerArticleResource.key]: {} },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('should provide inferred results with undefined', () => {
        expect(value).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('no result exists but primary key is used', () => {
      const state = {
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {},
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toBe(article);
      });
    });
    describe('no result exists but primary key is used when using nested schema', () => {
      const pageArticle = PaginatedArticleResource.fromJS(article);
      const state = {
        entities: {
          [PaginatedArticleResource.key]: {
            [params.id]: pageArticle,
          },
        },
        results: {},
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value.data).toBe(pageArticle);
      });
    });
    describe('not using primary key as param', () => {
      const urlParams = { title: 'bob' };
      const state = {
        entities: {
          [CoolerArticleResource.key]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(
            urlParams,
          )]: params.id,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toBe(article);
      });
    });
    it('should throw when results are Array', () => {
      const params = { title: 'bob' };
      const state = {
        entities: {},
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: [5, 6, 7],
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );
      expect(result.error).toBeDefined();
    });
    it('should throw when results are Object', () => {
      const params = { title: 'bob' };
      const state = {
        entities: {},
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: {
            results: [5, 6, 7],
          },
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useDenormalized(CoolerArticleResource.detailShape(), params, state),
      );
      expect(result.error).toBeDefined();
    });
    describe('nested resources', () => {
      const nestedArticle = NestedArticleResource.fromJS({
        ...params,
        user: 23,
      });
      const user = UserResource.fromJS({ id: 23, username: 'anne' });

      const state = {
        entities: {
          [NestedArticleResource.key]: {
            [`${nestedArticle.pk()}`]: nestedArticle,
          },
          [UserResource.key]: { [`${user.pk()}`]: user },
        },
        results: {},
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(NestedArticleResource.detailShape(), params, state),
      );
      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toMatchInlineSnapshot(`
          NestedArticleResource {
            "author": null,
            "content": "head",
            "id": 5,
            "tags": Array [],
            "title": "bob",
            "user": 23,
          }
        `);
      });
    });
  });

  describe('List', () => {
    const params = { things: 5 };
    const articles = [
      CoolerArticleResource.fromJS({ id: 5 }),
      CoolerArticleResource.fromJS({ id: 6 }),
      CoolerArticleResource.fromJS({ id: 34, title: 'five' }),
    ];
    describe('state is empty', () => {
      const state = { entities: {}, results: {}, meta: {} };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), {}, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(value).toMatchInlineSnapshot(`
          Object {
            "nextPage": "",
            "prevPage": "",
            "results": undefined,
          }
        `);
      });
    });
    describe('state is partial', () => {
      const { entities } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      const state = { entities, results: {}, meta: {} };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), {}, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('should provide inferred results with undefined for entity', () => {
        expect(value).toMatchInlineSnapshot(`undefined`);
      });
    });
    describe('state exists', () => {
      const { entities, result: resultState } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      const state = {
        entities,
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should provide inferred results', () => {
        expect(value).toEqual(articles);
      });
    });
    describe('missing some ids in entities table', () => {
      const { entities, result: resultState } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      delete entities[CoolerArticleResource.key]['5'];
      const state = {
        entities,
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(CoolerArticleResource.listShape(), params, state),
      );

      const expectedArticles = articles.slice(1);

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should simply ignore missing entities', () => {
        expect(value).toEqual(expectedArticles);
      });
    });
    describe('paginated results + missing some ids in entities table', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      delete entities[PaginatedArticleResource.key]['5'];
      const state = {
        entities,
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(
            params,
          )]: resultState,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should match normalized articles', () => {
        const expectedArticles = articles.slice(1);
        expect(value.results).toEqual(expectedArticles);
      });
    });
    describe('paginated results', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      const state = {
        entities,
        results: {
          [PaginatedArticleResource.listShape().getFetchKey(
            params,
          )]: resultState,
        },
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('found should be true', () => {
        expect(found).toBe(true);
      });

      it('should match normalized articles', () => {
        expect(value.results).toEqual(articles);
      });
    });
    describe('paginated results still loading', () => {
      const { entities, result: resultState } = normalize(
        { results: articles },
        PaginatedArticleResource.listShape().schema,
      );
      const state = {
        entities,
        results: {},
        meta: {},
      };
      const {
        result: {
          current: [value, found],
        },
      } = renderHook(() =>
        useDenormalized(PaginatedArticleResource.listShape(), params, state),
      );

      it('found should be false', () => {
        expect(found).toBe(false);
      });

      it('value should be inferred for pagination primitives', () => {
        expect(value).toMatchInlineSnapshot(`
          Object {
            "nextPage": "",
            "prevPage": "",
            "results": undefined,
          }
        `);
      });
    });
    it('should throw with invalid schemas', () => {
      const shape = PaginatedArticleResource.listShape();
      shape.schema = { happy: { go: { lucky: 5 } } } as any;
      const { result } = renderHook(() =>
        useDenormalized(shape, params, {} as any),
      );
      expect(result.error).toBeDefined();
    });
  });
});
