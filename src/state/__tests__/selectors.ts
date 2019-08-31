import { renderHook } from '@testing-library/react-hooks';
import {
  CoolerArticleResource,
  NestedArticleResource,
  PaginatedArticleResource,
  UserResource,
} from '../../__tests__/common';
import { normalize } from '../../resource';
import { useSchemaSelect } from '../selectors';

describe('selectors', () => {
  describe('Single', () => {
    const params = { id: 5, title: 'bob', content: 'head' };
    const article = CoolerArticleResource.fromJS(params);
    it('should be null when state is empty', () => {
      const state = { entities: {}, results: {}, meta: {} };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, { id: 5 }),
      );

      expect(result.current).toBe(null);
    });
    it('should be null when state is populated just not with our query', () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, {
          id: 543345345345453,
        }),
      );

      expect(result.current).toBe(null);
    });
    it('should find value when state exists', () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
      );

      expect(result.current).toBe(article);
    });
    it('should be null without entity', () => {
      const state = {
        entities: { [CoolerArticleResource.getKey()]: {} },
        results: {
          [CoolerArticleResource.detailShape().getFetchKey(params)]: params.id,
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
      );

      expect(result.current).toBe(null);
    });
    it('should find value when no result exists but primary key is used', () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {},
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
      );

      expect(result.current).toBe(article);
    });
    it('should find value when no result exists but primary key is used when using nested schema', () => {
      const pageArticle = PaginatedArticleResource.fromJS(article);
      const state = {
        entities: {
          [PaginatedArticleResource.getKey()]: {
            [params.id]: pageArticle,
          },
        },
        results: {},
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(PaginatedArticleResource.detailShape(), state, params),
      );

      expect(result.current).toBe(pageArticle);
    });
    it('should find value when not using primary key as param', () => {
      const urlParams = { title: 'bob' };
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
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
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
      );
      expect(result.current).toBe(article);
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
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
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
        useSchemaSelect(CoolerArticleResource.detailShape(), state, params),
      );
      expect(result.error).toBeDefined();
    });
    it('should handle nested resources', () => {
      const nestedArticle = NestedArticleResource.fromJS({
        ...params,
        user: 23,
      });
      const user = UserResource.fromJS({ id: 23, username: 'anne' });

      const state = {
        entities: {
          [NestedArticleResource.getKey()]: {
            [`${nestedArticle.pk()}`]: nestedArticle,
          },
          [UserResource.getKey()]: { [`${user.pk()}`]: user },
        },
        results: {},
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(NestedArticleResource.detailShape(), state, params),
      );
      expect(result.current).toBe(nestedArticle);
    });
  });
  describe('List', () => {
    const params = { things: 5 };
    const articles = [
      CoolerArticleResource.fromJS({ id: 5 }),
      CoolerArticleResource.fromJS({ id: 6 }),
      CoolerArticleResource.fromJS({ id: 34, title: 'five' }),
    ];
    it('should be null when state is empty', () => {
      const state = { entities: {}, results: {}, meta: {} };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.listShape(), state, {}),
      );

      expect(result.current).toBe(null);
    });
    it('should be null when state is partial', () => {
      const { entities } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      const state = { entities, results: {}, meta: {} };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.listShape(), state, {}),
      );

      expect(result.current).toBe(null);
    });
    it('should find value when state exists', () => {
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
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.listShape(), state, params),
      );

      expect(result.current).toEqual(articles);
    });
    it('should simply ignore missing entities when their id is found in results', () => {
      const { entities, result: resultState } = normalize(
        articles,
        CoolerArticleResource.listShape().schema,
      );
      delete entities[CoolerArticleResource.getKey()]['5'];
      const state = {
        entities,
        results: {
          [CoolerArticleResource.listShape().getFetchKey(params)]: resultState,
        },
        meta: {},
      };
      const { result } = renderHook(() =>
        useSchemaSelect(CoolerArticleResource.listShape(), state, params),
      );

      const expectedArticles = articles.slice(1);
      expect(result.current).toEqual(expectedArticles);
    });
    it('should work with paginated results', () => {
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
      const { result } = renderHook(() =>
        useSchemaSelect(PaginatedArticleResource.listShape(), state, params),
      );

      expect(result.current).toEqual(articles);
    });
    it('should throw with invalid schemas', () => {
      const shape = PaginatedArticleResource.listShape();
      shape.schema = { happy: { go: { lucky: 5 } } } as any;
      const { result } = renderHook(() =>
        useSchemaSelect(shape, {} as any, params),
      );
      expect(result.error).toBeDefined();
    });
  });
});
