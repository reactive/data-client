import { schema } from '@data-client/endpoint';
import { Article, IDEntity } from '__tests__/new';

import { denormalize } from '../denormalize/denormalize';
import { normalize } from '../normalizr/normalize';

describe('normalizer() merging', () => {
  describe('with instance.constructor.merge()', () => {
    it('should merge two Resource instances', () => {
      const id = 20;
      const { entities: first, entityMeta: firstEM } = normalize(Article, {
        id,
        title: 'hi',
        content: 'this is the content',
      });

      const { result, entities } = normalize(
        Article,
        { id, title: 'hello' },
        [],
        { entities: first, entityMeta: firstEM, indexes: {} },
      );

      const merged = denormalize(Article, result, entities);
      expect(merged).toBeInstanceOf(Article);
      expect(merged).toEqual(
        Article.fromJS({
          id,
          title: 'hello',
          content: 'this is the content',
        }),
      );
    });

    it('should not affect merging of plain objects', () => {
      const id = 20;
      const entitiesA = {
        [Article.key]: {
          [id]: Article.fromJS({
            id,
            title: 'hi',
            content: 'this is the content',
          }),
          [42]: Article.fromJS({
            id: 42,
            title: 'dont touch me',
            content: 'this is mine',
          }),
        },
      };

      const { entities } = normalize(
        Article,
        { id, title: 'hi', content: 'this is the content' },
        [],
        { entities: entitiesA, indexes: {}, entityMeta: {} },
      );

      expect(entities[Article.key][42]).toBe(entitiesA[Article.key][42]);
    });
  });

  describe('basics', function () {
    it('should assign `null` values', () => {
      const id = 20;
      const { entities: first, entityMeta: firstEM } = normalize(Article, {
        id,
        title: 'hi',
        content: 'this is the content',
      });

      const { result, entities } = normalize(Article, { id, title: null }, [], {
        entities: first,
        entityMeta: firstEM,
        indexes: {},
      });

      const merged = denormalize(Article, result, entities);
      expect(merged).toBeInstanceOf(Article);
      expect(merged).toEqual(
        Article.fromJS({
          id,
          title: null as any,
          content: 'this is the content',
        }),
      );
    });

    it('should not augment source objects', () => {
      const id = 20;
      const { entities: first } = normalize(Article, {
        id,
        title: 'hi',
        content: 'this is the content',
      });

      normalize(Article, { id, title: 'hello' }, [], {
        entities: first,
        indexes: {},
        entityMeta: {},
      });

      const merged = denormalize(Article, id, first);
      expect(merged).toBeInstanceOf(Article);
      expect(merged).toEqual(
        Article.fromJS({
          id,
          title: 'hi',
          content: 'this is the content',
        }),
      );
    });

    it('should still clone even when overwriting', () => {
      const id = 20;
      const { entities: first } = normalize(new schema.Invalidate(Article), {
        id,
      });

      const nested = { id, title: 'hello' };
      const { entities } = normalize(Article, nested, [], {
        entities: first,
        indexes: {},
        entityMeta: {},
      });

      expect(entities).toMatchInlineSnapshot(`
        {
          "Article": {
            "20": {
              "id": 20,
              "title": "hello",
            },
          },
        }
      `);

      expect(entities[Article.key][id]).not.toBe(nested);
    });
  });
});
