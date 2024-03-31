// eslint-env jest
import { Entity } from '@data-client/endpoint';

import MemoCache from '../denormalize/MemoCache';
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
  test('denormalizes suspends when symbol contains DELETED string', () => {
    const entities = {
      Tacos: {
        1: Symbol('ENTITY WAS DELETED'),
      },
    };
    expect(new MemoCache().denormalize('1', Tacos, entities).data).toEqual(
      expect.any(Symbol),
    );
  });
  test('maintains referential equality with same results', () => {
    const memo = new MemoCache();
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    const result = ['1', '2'];
    const schema = [Tacos];
    const { data: first } = memo.denormalize(result, schema, entities);
    const { data: second } = memo.denormalize(result, schema, entities);
    expect(first).toBe(second);

    const { data: third } = memo.denormalize([...result], schema, entities);
    expect(first).not.toBe(third);
    expect(first).toEqual(third);

    const fourth = memo.denormalize(result, schema, {
      Tacos: { ...entities.Tacos, 2: { id: '2', type: 'bar' } },
    }).data;
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
      const memo = new MemoCache();

      const result = { data: '123' };
      const schema = { data: Article };
      const first = memo.denormalize(result, schema, entities).data;
      const second = memo.denormalize(result, schema, entities).data;
      expect(first).toBe(second);
      const third = memo.denormalize('123', Article, entities).data;
      const fourth = memo.denormalize('123', Article, entities).data;
      expect(third).toBe(fourth);
    });

    test('maintains responds to entity updates for distinct top-level results', () => {
      const memo = new MemoCache();

      const result1 = { data: '123' };
      const result2 = { results: ['123'] };
      const first = memo.denormalize(result1, { data: Article }, entities).data;
      const second = memo.denormalize(
        result2,
        { results: [Article] },
        entities,
      ).data;
      expect(first.data).toBe(second.results[0]);
      const third = memo.denormalize('123', Article, entities).data;
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
      const firstChanged = memo.denormalize(
        result1,
        { data: Article },
        nextState,
      ).data;
      expect(firstChanged).not.toBe(first);
      const secondChanged = memo.denormalize(
        result2,
        { results: [Article] },
        nextState,
      ).data;
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
      const memo = new MemoCache();
      const resultCacheA = new WeakEntityMap();
      const resultCacheB = new WeakEntityMap();
      const resultCacheC = new WeakEntityMap();

      // we have different result values to represent different endpoint inputs
      const resultA = { data: '123' };
      const resultB = { data: '123' };
      const resultC = '123';
      const firstSchema = { data: ArticleSummary };
      const secondSchema = { data: Article };
      const first = memo.denormalize(resultA, firstSchema, entities).data;
      const second = memo.denormalize(resultB, secondSchema, entities).data;
      // show distinction between how they are denormalized
      expect(first.data.author).toMatchInlineSnapshot(`"8472"`);
      expect(second.data.author).toMatchInlineSnapshot(`
        User {
          "id": "8472",
          "name": "Paul",
        }
      `);
      expect(first.data).not.toBe(second.data);
      const firstWithoutChange = memo.denormalize(
        resultA,
        firstSchema,
        entities,
      ).data;
      expect(first).toBe(firstWithoutChange);

      const third = memo.denormalize(resultC, Article, entities).data;
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
      const firstChanged = memo.denormalize(
        resultA,
        firstSchema,
        nextState,
      ).data;
      expect(firstChanged).not.toBe(first);
      const secondChanged = memo.denormalize(
        resultB,
        secondSchema,
        nextState,
      ).data;
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
      const memo = new MemoCache();

      const result = { data: '123' };
      const { data: first } = memo.denormalize(
        result,
        { data: Article },
        entities,
      );
      const { data: second } = memo.denormalize(
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
      );
      expect(first).not.toBe(second);
      expect(first.data.author).toBe(second.data.author);
      expect(first.data.comments[0]).toBe(second.data.comments[0]);
    });

    test('nested entity equality changes', () => {
      const memo = new MemoCache();

      const result = { data: '123' };
      const { data: first } = memo.denormalize(
        result,
        { data: Article },
        entities,
      );

      const { data: second } = memo.denormalize(
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
      );

      expect(first).not.toBe(second);
      expect(first.data.title).toBe(second.data.title);
      expect(first.data.author).toBe(second.data.author);
      expect(second.data.comments[0].comment).toEqual('Updated comment!');
      expect(first.data.comments[0]).not.toBe(second.data.comments[0]);
      expect(first.data.comments[0].user).toBe(second.data.comments[0].user);
    });

    test('nested entity becomes present in entity table', () => {
      const memo = new MemoCache();

      const result = { data: '123' };
      const emptyEntities = {
        ...entities,
        // no Users exist
        User: {},
      };
      const { data: first } = memo.denormalize(
        result,
        { data: Article },
        emptyEntities,
      );

      const { data: second } = memo.denormalize(
        result,
        { data: Article },
        emptyEntities,
      );

      const { data: third } = memo.denormalize(
        result,
        { data: Article },
        // now has users
        entities,
      );

      expect(first.data.title).toBe(third.data.title);
      expect(first.data.author).toBeUndefined();
      // maintain cache when nested value is undefined
      expect(first.data).toBe(second.data);
      expect(first).toBe(second);
      // update value when nested value becomes defined
      expect(third.data.author).toBeDefined();
      expect(third.data.author.name).toEqual(expect.any(String));
      expect(first).not.toBe(third);
    });
  });

  test('nested entity becomes present in entity table with numbers', () => {
    const memo = new MemoCache();

    class User extends IDEntity {}
    class Article extends IDEntity {
      title = '';
      static schema = {
        author: User,
      };
    }
    const result = { data: 123 };
    const entities = {
      Article: {
        123: {
          author: 8472,
          id: 123,
          title: 'A Great Article',
        },
      },
      User: {
        8472: {
          id: 8472,
          name: 'Paul',
        },
      },
    };
    const emptyEntities = {
      ...entities,
      // no Users exist
      User: {},
    };
    const { data: first } = memo.denormalize(
      result,
      { data: Article },
      emptyEntities,
    );

    const { data: second } = memo.denormalize(
      result,
      { data: Article },
      emptyEntities,
    );

    const { data: third } = memo.denormalize(
      result,
      { data: Article },
      // now has users
      entities,
    );

    expect(first.data.title).toBe(third.data.title);
    expect(first.data.author).toBeUndefined();
    // maintain cache when nested value is undefined
    expect(first.data).toBe(second.data);
    expect(first).toBe(second);
    // update value when nested value becomes defined
    expect(third.data.author).toBeDefined();
    expect(third.data.author.name).toEqual(expect.any(String));
    expect(first).not.toBe(third);
  });

  test('denormalizes plain object with no entities', () => {
    const memo = new MemoCache();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'fifo' },
    };
    const schema = {
      firstThing: { five: 0, seven: 0 },
      secondThing: { cars: '' },
    };
    const { data: first } = memo.denormalize(input, schema, {});
    expect(first).toEqual(input);
    // should maintain referential equality
    const { data: second } = memo.denormalize(input, schema, {});
    expect(second).toBe(first);
  });

  test('passthrough for null schema and an object input', () => {
    const memo = new MemoCache();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'never' },
    };
    const { data } = memo.denormalize(input, null, {});
    expect(data).toBe(input);
  });

  test('passthrough for null schema and an number input', () => {
    const memo = new MemoCache();

    const input = 5;
    const { data } = memo.denormalize(input, null, {});
    expect(data).toBe(input);
  });

  test('passthrough for undefined schema and an object input', () => {
    const memo = new MemoCache();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'never' },
    };
    const { data } = memo.denormalize(input, undefined, {});
    expect(data).toBe(input);
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
      const memo = new MemoCache();

      const denorm = memo.denormalize(null, { data: Article }, {}).data;
      expect(denorm).toEqual(null);
    });

    test('handles undefined at top level', () => {
      const memo = new MemoCache();

      const denorm = memo.denormalize(undefined, { data: Article }, {}).data;
      expect(denorm).toEqual(undefined);
    });

    test('handles null in nested place', () => {
      const memo = new MemoCache();

      const input = {
        data: { id: '5', title: 'hehe', author: null, comments: [] },
      };
      const denorm = memo.denormalize(input, { data: Article }, {}).data;
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
    });
  });
});
