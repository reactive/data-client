// eslint-env jest
import { Entity } from '@rest-hooks/endpoint';

import { denormalize } from '../denormalize/denormalizeCached';
import WeakEntityMap from '../WeakEntityMap';

class IDEntity extends Entity {
  id = '';
  pk() {
    return this.id;
  }
}

class Tacos extends IDEntity {
  type = '';
}

let dateSpy;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe('denormalize with global cache', () => {
  test('maintains referential equality with same results', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    const result = ['1', '2'];
    const schema = [Tacos];
    const [first] = denormalize(
      result,
      schema,
      entities,
      entityCache,
      resultCache,
    );
    const [second] = denormalize(
      result,
      schema,
      entities,
      entityCache,
      resultCache,
    );
    expect(first).toBe(second);

    const [third] = denormalize(
      [...result],
      schema,
      entities,
      entityCache,
      resultCache,
    );
    expect(first).not.toBe(third);
    expect(first).toEqual(third);

    const fourth = denormalize(
      result,
      schema,
      { Tacos: { ...entities.Tacos, 2: { id: '2', type: 'bar' } } },
      entityCache,
      resultCache,
    )[0];
    expect(first).not.toBe(fourth);
    expect(first).toEqual(fourth);
  });

  describe('nested entities', () => {
    class User extends IDEntity {}
    class Comment extends IDEntity {
      comment = '';
      static schema = {
        user: User,
      };
    }
    class Article extends IDEntity {
      title = '';
      body = '';
      static schema = {
        author: User,
        comments: [Comment],
      };
    }

    const entities = {
      Article: {
        123: {
          author: '8472',
          body: 'This article is great.',
          comments: ['comment-123-4738'],
          id: '123',
          title: 'A Great Article',
        },
      },
      Comment: {
        'comment-123-4738': {
          comment: 'I like it!',
          id: 'comment-123-4738',
          user: '10293',
        },
      },
      User: {
        10293: {
          id: '10293',
          name: 'Jane',
        },
        8472: {
          id: '8472',
          name: 'Paul',
        },
      },
    };

    test('maintains referential equality with nested entities', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const result = { data: '123' };
      const schema = { data: Article };
      const first = denormalize(
        result,
        schema,
        entities,
        entityCache,
        resultCache,
      )[0];
      const second = denormalize(
        result,
        schema,
        entities,
        entityCache,
        resultCache,
      )[0];
      expect(first).toBe(second);
      const third = denormalize(
        '123',
        Article,
        entities,
        entityCache,
        resultCache,
      )[0];
      const fourth = denormalize(
        '123',
        Article,
        entities,
        entityCache,
        resultCache,
      )[0];
      expect(third).toBe(fourth);
    });

    test('maintains responds to entity updates for distinct top-level results', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const result1 = { data: '123' };
      const result2 = { results: ['123'] };
      const first = denormalize(
        result1,
        { data: Article },
        entities,
        entityCache,
        resultCache,
      )[0];
      const second = denormalize(
        result2,
        { results: [Article] },
        entities,
        entityCache,
        resultCache,
      )[0];
      expect(first.data).toBe(second.results[0]);
      const third = denormalize(
        '123',
        Article,
        entities,
        entityCache,
        resultCache,
      )[0];
      expect(third).toBe(first.data);

      // now change
      const nextState = {
        ...entities,
        Article: {
          123: {
            ...entities.Article[123],
            title: 'updated article',
            body: 'new body',
          },
        },
      };
      const firstChanged = denormalize(
        result1,
        { data: Article },
        nextState,
        entityCache,
        resultCache,
      )[0];
      expect(firstChanged).not.toBe(first);
      const secondChanged = denormalize(
        result2,
        { results: [Article] },
        nextState,
        entityCache,
        resultCache,
      )[0];
      expect(secondChanged).not.toBe(second);
      expect(firstChanged.data).toBe(secondChanged.results[0]);
    });

    test('handles multi-schema (summary entities)', () => {
      class ArticleSummary extends IDEntity {
        title = '';
        body = '';
        static schema = {
          comments: [Comment],
        };

        static key = 'Article';
      }
      const entityCache = {};
      // we have different result caches because they are keyed based on the endpoint
      const resultCacheA = new WeakEntityMap();
      const resultCacheB = new WeakEntityMap();
      const resultCacheC = new WeakEntityMap();

      const result = { data: '123' };
      const firstSchema = { data: ArticleSummary };
      const secondSchema = { data: Article };
      const first = denormalize(
        result,
        firstSchema,
        entities,
        entityCache,
        resultCacheA,
      )[0];
      const second = denormalize(
        result,
        secondSchema,
        entities,
        entityCache,
        resultCacheB,
      )[0];
      // show distinction between how they are denormalized
      expect(first.data.author).toMatchInlineSnapshot(`"8472"`);
      expect(second.data.author).toMatchInlineSnapshot(`
        User {
          "id": "8472",
          "name": "Paul",
        }
      `);
      expect(first.data).not.toBe(second.data);
      const firstWithoutChange = denormalize(
        result,
        firstSchema,
        entities,
        entityCache,
        resultCacheA,
      )[0];
      expect(first).toBe(firstWithoutChange);

      const third = denormalize(
        '123',
        Article,
        entities,
        entityCache,
        resultCacheC,
      )[0];
      expect(third).toBe(second.data);

      // now change
      const nextState = {
        ...entities,
        Article: {
          123: {
            ...entities.Article[123],
            title: 'updated article',
            body: 'new body',
          },
        },
      };
      const firstChanged = denormalize(
        result,
        firstSchema,
        nextState,
        entityCache,
        resultCacheA,
      )[0];
      expect(firstChanged).not.toBe(first);
      const secondChanged = denormalize(
        result,
        secondSchema,
        nextState,
        entityCache,
        resultCacheB,
      )[0];
      expect(secondChanged).not.toBe(second);
      expect(firstChanged.data.author).toMatchInlineSnapshot(`"8472"`);
      expect(secondChanged.data.author).toMatchInlineSnapshot(`
        User {
          "id": "8472",
          "name": "Paul",
        }
      `);
    });

    test('entity equality changes', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const result = { data: '123' };
      const [first] = denormalize(
        result,
        { data: Article },
        entities,
        entityCache,
        resultCache,
      );
      const [second] = denormalize(
        result,
        { data: Article },
        {
          ...entities,
          Article: {
            123: {
              author: '8472',
              body: 'This article is great.',
              comments: ['comment-123-4738'],
              id: '123',
              title: 'A Great Article',
            },
          },
        },
        entityCache,
        resultCache,
      );
      expect(first).not.toBe(second);
      expect(first.data.author).toBe(second.data.author);
      expect(first.data.comments[0]).toBe(second.data.comments[0]);
    });

    test('nested entity equality changes', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const result = { data: '123' };
      const [first] = denormalize(
        result,
        { data: Article },
        entities,
        entityCache,
        resultCache,
      );

      const [second] = denormalize(
        result,
        { data: Article },
        {
          ...entities,
          Comment: {
            'comment-123-4738': {
              comment: 'Updated comment!',
              id: 'comment-123-4738',
              user: '10293',
            },
          },
        },
        entityCache,
        resultCache,
      );

      expect(first).not.toBe(second);
      expect(first.title).toBe(second.title);
      expect(first.data.author).toBe(second.data.author);
      expect(second.data.comments[0].comment).toEqual('Updated comment!');
      expect(first.data.comments[0]).not.toBe(second.data.comments[0]);
      expect(first.data.comments[0].user).toBe(second.data.comments[0].user);
    });
  });

  test('denormalizes plain object with no entities', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'fifo' },
    };
    const schema = {
      firstThing: { five: 0, seven: 0 },
      secondThing: { cars: '' },
    };
    const [first, found, deleted] = denormalize(
      input,
      schema,
      {},
      entityCache,
      resultCache,
    );
    expect(first).toEqual(input);
    expect(found).toBe(true);
    expect(deleted).toBe(false);
    // should maintain referential equality
    const [second] = denormalize(input, schema, {}, {}, resultCache);
    expect(second).toBe(first);
  });

  test('passthrough for null schema and an object input', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'never' },
    };
    const [denorm, found, deleted] = denormalize(
      input,
      null,
      {},
      entityCache,
      resultCache,
    );
    expect(denorm).toBe(input);
    expect(found).toBe(true);
    expect(deleted).toBe(false);
  });

  test('passthrough for null schema and an number input', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();

    const input = 5;
    const [denorm, found, deleted] = denormalize(
      input,
      null,
      {},
      entityCache,
      resultCache,
    );
    expect(denorm).toBe(input);
    expect(found).toBe(true);
    expect(deleted).toBe(false);
  });

  test('passthrough for undefined schema and an object input', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'never' },
    };
    const [denorm, found, deleted] = denormalize(
      input,
      undefined,
      {},
      entityCache,
      resultCache,
    );
    expect(denorm).toBe(input);
    expect(found).toBe(true);
    expect(deleted).toBe(false);
  });

  describe('null inputs when expecting entities', () => {
    class User extends IDEntity {}
    class Comment extends IDEntity {
      comment = '';
      static schema = {
        user: User,
      };
    }
    class Article extends IDEntity {
      title = '';
      body = '';
      author = User.fromJS({});
      comments = [];
      static schema = {
        author: User,
        comments: [Comment],
      };
    }

    test('handles null at top level', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const [denorm, found, deleted] = denormalize(
        null,
        { data: Article },
        {},
        entityCache,
        resultCache,
      );
      expect(denorm).toEqual(null);
      expect(found).toBe(true);
      expect(deleted).toBe(false);
    });

    test('handles undefined at top level', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const [denorm, found, deleted] = denormalize(
        undefined,
        { data: Article },
        {},
        entityCache,
        resultCache,
      );
      expect(denorm).toEqual(undefined);
      expect(found).toBe(false);
      expect(deleted).toBe(false);
    });

    test('handles null in nested place', () => {
      const entityCache = {};
      const resultCache = new WeakEntityMap();

      const input = {
        data: { id: '5', title: 'hehe', author: null, comments: [] },
      };
      const [denorm, found, deleted] = denormalize(
        input,
        { data: Article },
        {},
        entityCache,
        resultCache,
      );
      expect(denorm).toMatchInlineSnapshot(`
        {
          "data": Article {
            "author": null,
            "body": "",
            "comments": [],
            "id": "5",
            "title": "hehe",
          },
        }
      `);
      expect(found).toBe(true);
      expect(deleted).toBe(false);
    });
  });
});
