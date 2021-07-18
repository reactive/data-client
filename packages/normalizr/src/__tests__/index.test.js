// eslint-env jest
import { fromJS } from 'immutable';

import { denormalizeSimple as denormalize } from '../denormalize';
import { normalize, schema } from '../';
import Entity from '../entities/Entity';
import IDEntity from '../entities/IDEntity';
import { DELETED } from '../special';
import WeakListMap from '../WeakListMap';

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

describe('normalize', () => {
  [42, null, undefined, '42', () => {}].forEach(input => {
    test(`cannot normalize input that == ${input}`, () => {
      class Test extends IDEntity {}
      expect(() => normalize(input, Test)).toThrow();
    });
  });

  test('passthrough with undefined schema', () => {
    const input = {};
    expect(normalize(input).result).toBe(input);
  });

  test('passthrough with id in place of entity', () => {
    const input = { taco: 5 };
    expect(normalize(input, { taco: Tacos }).result).toStrictEqual(input);
  });

  test('cannot normalize with null input', () => {
    expect(() => normalize(null, Tacos)).toThrow(/null/);
  });

  test('passthrough primitive schema', () => {
    expect(normalize({ happy: { bob: 5 } }, { happy: 5 }).result).toStrictEqual(
      {
        happy: { bob: 5 },
      },
    );
  });

  test('can normalize string', () => {
    const mySchema = '';
    expect(normalize('bob', mySchema)).toMatchInlineSnapshot(`
      Object {
        "entities": Object {},
        "entityMeta": Object {},
        "indexes": Object {},
        "result": "bob",
      }
    `);
  });

  test('normalizes entities', () => {
    expect(
      normalize(
        [
          { id: '1', type: 'foo' },
          { id: '2', type: 'bar' },
        ],
        [Tacos],
      ),
    ).toMatchSnapshot();
  });

  test('normalizes schema with extra members', () => {
    expect(
      normalize(
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
          extra: 'five',
          page: {
            first: null,
            second: { thing: 'two' },
            third: 1,
            complex: { complex: false, next: true },
          },
        },
        {
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
      ),
    ).toMatchSnapshot();
  });

  test('normalizes schema with extra members but not set', () => {
    expect(
      normalize(
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
        },
        {
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
      ),
    ).toMatchSnapshot();
  });

  test('normalizes schema with indexes', () => {
    class MyTaco extends Tacos {
      static indexes = ['type'];
    }

    expect(
      normalize(
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
          alt: { id: '2', type: 'bar2' },
        },
        { data: [MyTaco], alt: MyTaco },
      ),
    ).toMatchSnapshot();
  });

  test('normalizes warns on schemas with unfound indexes', () => {
    const oldError = console.warn;
    const spy = (console.warn = jest.fn());

    class MyTaco extends Tacos {
      static indexes = ['notfound'];
    }

    expect(
      normalize(
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
          alt: { id: '2', type: 'bar2' },
        },
        { data: [MyTaco], alt: MyTaco },
      ),
    ).toMatchSnapshot();

    expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "Index not found in entity. Indexes must be top-level members of your entity.
      Index: notfound
      Entity: {
        \\"id\\": \\"1\\",
        \\"type\\": \\"foo\\"
      }",
      ]
    `);
    console.warn = oldError;
  });

  test('normalizes entities with circular references', () => {
    class User extends IDEntity {}
    User.schema = { friends: [User] };

    const input = { id: '123', friends: [] };
    input.friends.push(input);

    expect(normalize(input, User)).toMatchSnapshot();
  });

  test('normalizes nested entities', () => {
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

    const input = {
      id: '123',
      title: 'A Great Article',
      author: {
        id: '8472',
        name: 'Paul',
      },
      body: 'This article is great.',
      comments: [
        {
          id: 'comment-123-4738',
          comment: 'I like it!',
          user: {
            id: '10293',
            name: 'Jane',
          },
        },
      ],
    };
    expect(normalize(input, Article)).toMatchSnapshot();
  });

  test('does not modify the original input', () => {
    class User extends IDEntity {}
    class Article extends IDEntity {
      title = '';
      static schema = {
        author: User,
      };
    }
    const input = Object.freeze({
      id: '123',
      title: 'A Great Article',
      author: Object.freeze({
        id: '8472',
        name: 'Paul',
      }),
    });
    expect(() => normalize(input, Article)).not.toThrow();
  });

  test('ignores null values', () => {
    class MyEntity extends IDEntity {}
    expect(normalize([null], [MyEntity])).toMatchSnapshot();
    expect(normalize([undefined], [MyEntity])).toMatchSnapshot();
    expect(normalize([false], [MyEntity])).toMatchSnapshot();
  });

  test('can use fully custom entity classes', () => {
    class Children extends IDEntity {
      name = '';
    }
    class MyEntity extends Entity {
      uuid = '';
      name = '';

      static schema = {
        children: [Children],
      };

      pk(parent, key) {
        return this.uuid;
      }

      static normalize(input, parent, key, visit, addEntity, visitedEntities) {
        const entity = { ...input };
        Object.keys(this.schema).forEach(key => {
          const schema = this.schema[key];
          entity[key] = visit(
            input[key],
            input,
            key,
            schema,
            addEntity,
            visitedEntities,
          );
        });
        addEntity(this, entity, this.pk(entity));
        return {
          uuid: this.pk(entity),
          schema: this.key,
        };
      }
    }

    class Food extends MyEntity {}
    expect(
      normalize(
        {
          uuid: '1234',
          name: 'tacos',
          children: [{ id: 4, name: 'lettuce' }],
        },
        Food,
      ),
    ).toMatchSnapshot();
  });

  test('uses the non-normalized input when getting the ID for an entity', () => {
    const calls = [];
    class User extends IDEntity {}
    class Recommendations extends Entity {
      pk(parent, key) {
        calls.push([this, parent, key]);
        return parent.user.id;
      }

      static schema = { user: User };
    }

    expect(
      normalize({ user: { id: '456' } }, Recommendations),
    ).toMatchSnapshot();
    expect(calls).toMatchSnapshot();
  });

  test('passes over pre-normalized values', () => {
    class User extends IDEntity {}
    class Article extends IDEntity {
      title = '';
      static schema = { author: User };
    }

    expect(
      normalize(
        { id: '123', title: 'normalizr is great!', author: '1' },
        Article,
      ),
    ).toMatchSnapshot();

    expect(normalize({ user: '1' }, { user: User })).toMatchSnapshot();
  });

  test('can normalize object without proper object prototype inheritance', () => {
    const test = { id: '1', elements: [] };
    test.elements.push(
      Object.assign(Object.create(null), {
        id: '18',
        name: 'test',
      }),
    );

    class Elements extends IDEntity {}
    class Test extends IDEntity {
      static schema = {
        elements: [Elements],
      };
    }

    expect(() => normalize(test, Test)).not.toThrow();
  });
});

describe('denormalize', () => {
  test('passthrough with undefined schema', () => {
    const input = {};
    expect(denormalize(input)).toStrictEqual([input, true, false]);
  });

  test('returns the input if undefined', () => {
    expect(denormalize(undefined, {}, {})).toEqual([undefined, false, false]);
  });

  test('returns the input if string', () => {
    expect(denormalize('bob', '', {})).toEqual(['bob', true, false]);
  });

  test('denormalizes entities', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    expect(denormalize(['1', '2'], [Tacos], entities)[0]).toMatchSnapshot();
  });

  test('denormalizes without entities fills undefined', () => {
    expect(denormalize({ data: '1' }, { data: Tacos }, {})).toMatchSnapshot();
    expect(
      denormalize(fromJS({ data: '1' }), { data: Tacos }, {}),
    ).toMatchSnapshot();
    expect(denormalize('1', Tacos, {})).toEqual([undefined, false, false]);
  });

  test('denormalizes ignoring unfound entities in arrays', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
      },
    };
    expect(denormalize(['1', '2'], [Tacos], entities)).toMatchSnapshot();
    expect(
      denormalize({ results: ['1', '2'] }, { results: [Tacos] }, entities),
    ).toMatchSnapshot();
  });

  test('denormalizes ignoring deleted entities in arrays', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: DELETED,
      },
    };
    expect(denormalize(['1', '2'], [Tacos], entities)).toMatchSnapshot();
    expect(
      denormalize({ results: ['1', '2'] }, { results: [Tacos] }, entities),
    ).toMatchSnapshot();
  });

  test('denormalizes arrays with objects inside', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
      },
    };
    /*expect(
      denormalize([{ data: 1 }, { data: 2 }], [{ data: Tacos }], {})[0],
    ).toEqual([]);*/
    expect(
      denormalize([{ data: 1 }, { data: 2 }], [{ data: Tacos }], entities)[0],
    ).toMatchSnapshot();
  });

  test('denormalizes schema with extra members', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    expect(
      denormalize(
        {
          data: ['1', '2'],
          extra: '5',
          page: {
            first: null,
            second: { thing: 'two' },
            third: 1,
            complex: { complex: false, next: true },
          },
        },
        {
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
        entities,
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes schema with extra members but not set', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    expect(
      denormalize(
        {
          data: ['1', '2'],
        },
        {
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
        entities,
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes nested entities', () => {
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
    expect(denormalize('123', Article, entities)).toMatchSnapshot();
  });

  test('gracefully handles when nested entities are primitives', () => {
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
        'comment-123-4738': 4,
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
    expect(() => denormalize('123', Article, entities)).toMatchSnapshot();
  });

  test('set to undefined if schema key is not in entities', () => {
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

      static validate() {}
    }

    const entities = {
      Article: {
        123: {
          id: '123',
          author: '8472',
          comments: ['1'],
        },
      },
      Comment: {
        1: {
          id: '1',
          user: '123',
        },
      },
    };
    expect(denormalize('123', Article, entities)).toMatchSnapshot();
  });

  test('does not modify the original entities', () => {
    class User extends IDEntity {}
    class Article extends IDEntity {
      static schema = {
        author: User,
      };
    }
    const entities = Object.freeze({
      Article: Object.freeze({
        123: Object.freeze({
          id: '123',
          title: 'A Great Article',
          author: '8472',
        }),
      }),
      User: Object.freeze({
        8472: Object.freeze({
          id: '8472',
          name: 'Paul',
        }),
      }),
    });
    expect(() => denormalize('123', Article, entities)).not.toThrow();
  });

  test('denormalizes with function as pk()', () => {
    class Guest extends Entity {
      pk(parent, key) {
        return `${key}-${parent.id}-${this.guestId}`;
      }
    }
    class Patron extends IDEntity {
      static schema = {
        guest: Guest,
      };
    }

    const normalizedData = {
      entities: {
        Patron: {
          1: { id: '1', guest: null, name: 'Esther' },
          2: { id: '2', guest: 'guest-2-1', name: 'Tom' },
        },
        Guest: { 'guest-2-1': { guestId: 1 } },
      },
      result: ['1', '2'],
    };

    expect(
      denormalize(normalizedData.result, [Patron], normalizedData.entities),
    ).toMatchSnapshot();
  });
});

describe('denormalize with global cache', () => {
  test('maintains referential equality with same results', () => {
    const entityCache = {};
    const resultCache = new WeakListMap();
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    const result = ['1', '2'];
    const [first] = denormalize(
      result,
      [Tacos],
      entities,
      entityCache,
      resultCache,
    );
    const [second] = denormalize(
      result,
      [Tacos],
      entities,
      entityCache,
      resultCache,
    );
    expect(first).toBe(second);

    const [third] = denormalize(
      [...result],
      [Tacos],
      entities,
      entityCache,
      resultCache,
    );
    expect(first).not.toBe(third);
    expect(first).toEqual(third);

    const fourth = denormalize(
      result,
      [Tacos],
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
      const resultCache = new WeakListMap();

      const result = { data: '123' };
      const first = denormalize(
        result,
        { data: Article },
        entities,
        entityCache,
        resultCache,
      )[0];
      const second = denormalize(
        result,
        { data: Article },
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

    test('entity equality changes', () => {
      const entityCache = {};
      const resultCache = new WeakListMap();

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
      const resultCache = new WeakListMap();

      const result = { data: '123' };
      const [first] = denormalize(
        result,
        { data: Article },
        entities,
        entityCache,
        resultCache,
      );
      console.log('>>>>>>>>>>>>>');
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
      console.log(resultCache);
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
    const resultCache = new WeakListMap();

    const input = {
      firstThing: { five: 5, seven: 42 },
      secondThing: { cars: 'fifo' },
    };
    const [first, found, deleted] = denormalize(
      input,
      {
        firstThing: { five: 0, seven: 0 },
        secondThing: { cars: '' },
      },
      {},
      entityCache,
      resultCache,
    );
    expect(first).toEqual(input);
    expect(found).toBe(true);
    expect(deleted).toBe(false);
    // should maintain referential equality
    const [second] = denormalize(
      input,
      {
        firstThing: { five: 0, seven: 0 },
        secondThing: { cars: '' },
      },
      {},
      {},
      resultCache,
    );
    expect(second).toBe(first);
  });

  test('passthrough for null schema and an object input', () => {
    const entityCache = {};
    const resultCache = new WeakListMap();

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
    const resultCache = new WeakListMap();

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
    const resultCache = new WeakListMap();

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
      const resultCache = new WeakListMap();

      const [denorm, found, deleted] = denormalize(
        null,
        { data: Article },
        {},
        entityCache,
        resultCache,
      );
      expect(denorm).toEqual({});
      expect(found).toBe(false);
      expect(deleted).toBe(false);
    });

    test('handles null in nested place', () => {
      const entityCache = {};
      const resultCache = new WeakListMap();

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
        Object {
          "data": Article {
            "author": null,
            "body": "",
            "comments": Array [],
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
