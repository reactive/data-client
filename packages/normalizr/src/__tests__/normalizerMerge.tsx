import { ArticleResource } from '__tests__/common';

import { denormalize } from '../denormalize';
import { normalize } from '../normalize';
import Delete from '../schemas/Delete';

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
        ArticleResource,
      );

      const { result, entities } = normalize(
        { id, title: 'hello' },
        ArticleResource,
        first,
      );

      const [merged] = denormalize(result, ArticleResource, entities);
      expect(merged).toBeInstanceOf(ArticleResource);
      expect(merged).toEqual(
        ArticleResource.fromJS({
          id,
          title: 'hello',
          content: 'this is the content',
        }),
      );
    });

    it('should not affect merging of plain objects', () => {
      const id = 20;
      const entitiesA = {
        [ArticleResource.key]: {
          [id]: ArticleResource.fromJS({
            id,
            title: 'hi',
            content: 'this is the content',
          }),
          [42]: ArticleResource.fromJS({
            id: 42,
            title: 'dont touch me',
            content: 'this is mine',
          }),
        },
      };

      const { entities } = normalize(
        { id, title: 'hi', content: 'this is the content' },
        ArticleResource,
        entitiesA,
      );

      expect(entities[ArticleResource.key][42]).toBe(
        entitiesA[ArticleResource.key][42],
      );
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
        ArticleResource,
      );

      const { result, entities } = normalize(
        { id, title: null },
        ArticleResource,
        first,
      );

      const [merged] = denormalize(result, ArticleResource, entities);
      expect(merged).toBeInstanceOf(ArticleResource);
      expect(merged).toEqual(
        ArticleResource.fromJS({
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
        ArticleResource,
      );

      normalize({ id, title: 'hello' }, ArticleResource, first);

      const [merged] = denormalize(id, ArticleResource, first);
      expect(merged).toBeInstanceOf(ArticleResource);
      expect(merged).toEqual(
        ArticleResource.fromJS({
          id,
          title: 'hi',
          content: 'this is the content',
        }),
      );
    });

    it('should still clone even when overwriting', () => {
      const id = 20;
      const { entities: first } = normalize(
        { id },
        new Delete(ArticleResource),
      );

      const nested = { id, title: 'hello' };
      const { entities } = normalize(nested, ArticleResource, first);

      expect(entities).toMatchInlineSnapshot(`
        {
          "http://test.com/article/": {
            "20": {
              "id": 20,
              "title": "hello",
            },
          },
        }
      `);

      expect(entities[ArticleResource.key][id]).not.toBe(nested);
    });
  });
});
