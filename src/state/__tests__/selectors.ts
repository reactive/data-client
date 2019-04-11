import {
  CoolerArticleResource,
  NestedArticleResource,
  PaginatedArticleResource,
  UserResource,
} from '../../__tests__/common';
import { normalize } from '../../resource';
import { makeSchemaSelector } from '../selectors';

let { schema, getUrl } = CoolerArticleResource.singleRequest();
const select = makeSchemaSelector(schema, getUrl);
let listR = CoolerArticleResource.listRequest();
const listSelect = makeSchemaSelector(listR.schema, listR.getUrl);
describe('selectors', () => {
  describe('Single', () => {
    const params = { id: 5, title: 'bob', content: 'head' };
    const article = CoolerArticleResource.fromJS(params);
    it('should be null when state is empty', async () => {
      const state = { entities: {}, results: {}, meta: {} };
      const article = select(state, { id: 5 });

      expect(article).toBe(null);
    });
    it('should be null when state is populated just not with our query', async () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.url(params)]: params.id,
        },
        meta: {},
      };
      const selected = select(state, { id: 543345345345453 });

      expect(selected).toBe(null);
    });
    it('should find value when state exists', async () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {
          [CoolerArticleResource.url(params)]: params.id,
        },
        meta: {},
      };
      const selected = select(state, params);

      expect(selected).toBe(article);
    });
    it('should be null without entity', async () => {
      const state = {
        entities: { [CoolerArticleResource.getKey()]: {} },
        results: {
          [CoolerArticleResource.url(params)]: params.id,
        },
        meta: {},
      };
      const selected = select(state, params);

      expect(selected).toBe(null);
    });
    it('should find value when no result exists but primary key is used', async () => {
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: {},
        meta: {},
      };
      const selected = select(state, params);

      expect(selected).toBe(article);
    });
    it('should find value when no result exists but primary key is used when using nested schema', async () => {
      const pageArticle = PaginatedArticleResource.fromJS(article);
      let { schema, getUrl } = PaginatedArticleResource.singleRequest();
      const select = makeSchemaSelector(schema, getUrl);
      const state = {
        entities: {
          [PaginatedArticleResource.getKey()]: {
            [params.id]: pageArticle,
          },
        },
        results: {},
        meta: {},
      };
      const selected = select(state, params);

      expect(selected).toBe(pageArticle);
    });
    it('should find value when not using primary key as param', async () => {
      const urlParams = { title: 'bob' };
      const state = {
        entities: {
          [CoolerArticleResource.getKey()]: {
            [params.id]: article,
          },
        },
        results: { [CoolerArticleResource.url(urlParams)]: params.id },
        meta: {},
      };
      expect(select(state, urlParams)).toBe(article);
    });
    it('should throw when results are Array', async () => {
      const params = { title: 'bob' };
      const state = {
        entities: {},
        results: { [CoolerArticleResource.url(params)]: [5, 6, 7] },
        meta: {},
      };
      expect(() => select(state, params)).toThrow();
    });
    it('should throw when results are Object', async () => {
      const params = { title: 'bob' };
      const state = {
        entities: {},
        results: {
          [CoolerArticleResource.url(params)]: { results: [5, 6, 7] },
        },
        meta: {},
      };
      expect(() => select(state, params)).toThrow();
    });
    it('should handle nested resources', async () => {
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
      const shape = NestedArticleResource.singleRequest();
      const select = makeSchemaSelector(shape.schema, shape.getUrl);
      expect(select(state, params)).toBe(nestedArticle);
    });
  });
  describe('List', () => {
    const params = { things: 5 };
    const articles = [
      CoolerArticleResource.fromJS({ id: 5 }),
      CoolerArticleResource.fromJS({ id: 6 }),
      CoolerArticleResource.fromJS({ id: 34, title: 'five' }),
    ];
    it('should be null when state is empty', async () => {
      const state = { entities: {}, results: {}, meta: {} };
      const articles = listSelect(state, {});

      expect(articles).toBe(null);
    });
    it('should be null when state is partial', async () => {
      const { entities } = normalize(
        articles,
        CoolerArticleResource.listRequest().schema,
      );
      const state = { entities, results: {}, meta: {} };
      const selected = listSelect(state, {});

      expect(selected).toBe(null);
    });
    it('should find value when state exists', async () => {
      const { entities, result } = normalize(
        articles,
        CoolerArticleResource.listRequest().schema,
      );
      const state = {
        entities,
        results: {
          [CoolerArticleResource.listUrl(params)]: result,
        },
        meta: {},
      };
      const selected = listSelect(state, params);

      expect(selected).toEqual(articles);
    });
    it('should simply ignore missing entities when their id is found in results', async () => {
      const { entities, result } = normalize(
        articles,
        CoolerArticleResource.listRequest().schema,
      );
      delete entities[CoolerArticleResource.getKey()]['5'];
      const state = {
        entities,
        results: {
          [CoolerArticleResource.listUrl(params)]: result,
        },
        meta: {},
      };
      const selected = listSelect(state, params);

      const expectedArticles = articles.slice(1);
      expect(selected).toEqual(expectedArticles);
    });
    it('should work with paginated results', async () => {
      const { entities, result } = normalize(
        { results: articles },
        PaginatedArticleResource.listRequest().schema,
      );
      const state = {
        entities,
        results: {
          [PaginatedArticleResource.listUrl(params)]: result,
        },
        meta: {},
      };
      const shape = PaginatedArticleResource.listRequest();
      const select = makeSchemaSelector(shape.schema, shape.getUrl);
      const selected = select(state, params);

      expect(selected).toEqual(articles);
    });
    it('should throw with invalid schemas', async () => {
      const shape = PaginatedArticleResource.listRequest();
      expect(() =>
        makeSchemaSelector(
          { happy: { go: { lucky: 5 } } } as any,
          shape.getUrl,
        ),
      ).toThrow();
    });
  });
});
