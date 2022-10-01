import { Article } from '__tests__/new';
import { schema } from '@rest-hooks/endpoint';

import { denormalize } from '../denormalize';
import { normalize } from '../normalize';

describe('normalizer() merging', () => {
  describe('with instance.constructor.merge()', () => {
    it('should merge two Resource instances', () => {
      const id = 20;
      const { entities: first } = normalize(
        {
          id,
          title: 'hi',
          content: 'this is the content',
        },
        Article,
      );

      const { result, entities } = normalize(
        { id, title: 'hello' },
        Article,
        first,
      );

      const [merged] = denormalize(result, Article, entities);
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
        { id, title: 'hi', content: 'this is the content' },
        Article,
        entitiesA,
      );

      expect(entities[Article.key][42]).toBe(entitiesA[Article.key][42]);
    });
  });

  describe('basics', function () {
    it('should assign `null` values', () => {
      const id = 20;
      const { entities: first } = normalize(
        {
          id,
          title: 'hi',
          content: 'this is the content',
        },
        Article,
      );

      const { result, entities } = normalize(
        { id, title: null },
        Article,
        first,
      );

      const [merged] = denormalize(result, Article, entities);
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
      const { entities: first } = normalize(
        {
          id,
          title: 'hi',
          content: 'this is the content',
        },
        Article,
      );

      normalize({ id, title: 'hello' }, Article, first);

      const [merged] = denormalize(id, Article, first);
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
      const { entities: first } = normalize({ id }, new schema.Delete(Article));

      const nested = { id, title: 'hello' };
      const { entities } = normalize(nested, Article, first);

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
