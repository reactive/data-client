// eslint-env jest
import { Entity, schema } from '@rest-hooks/endpoint';
import { fromJS } from 'immutable';

import { normalize } from '../';
import { denormalize as denormalizeSimple } from '../denormalize/denormalize';
import { denormalize as denormalizeCached } from '../denormalize/denormalizeCached';
import { DELETED } from '../special';

class IDEntity extends Entity {
  id = '';
  pk(parent, key) {
    return this.id || key;
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

describe('normalize', () => {
  test.each([42, null, undefined, '42', () => {}])(
    `cannot normalize input that == %s`,
    input => {
      class Test extends IDEntity {}
      expect(() => normalize(input, Test)).toThrow();
    },
  );
  test.each([42, null, undefined, '42', () => {}])(
    `cannot normalize input that == %s`,
    input => {
      class Test extends IDEntity {}
      expect(() => normalize(input, { data: Test })).toThrow();
    },
  );

  test('can normalize strings for entity (already processed)', () => {
    class Test extends IDEntity {}
    expect(normalize(['42'], new schema.Array(Test)).result).toEqual(['42']);
  });

  test('can normalize null schema with string response', () => {
    expect(normalize('17,234', null).result).toEqual('17,234');
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
      {
        "entities": {},
        "entityMeta": {},
        "indexes": {},
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
      [
        "Index not found in entity. Indexes must be top-level members of your entity.
      Index: notfound
      Entity: {
        "id": "1",
        "type": "foo"
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

function denormalizeCachedValue(...args) {
  return denormalizeCached(...args)[0];
}
describe.each([
  ['fast', denormalizeSimple],
  ['cached', denormalizeCachedValue],
])(`denormalize [%s]`, (_, denormalize) => {
  test('passthrough with undefined schema', () => {
    const input = {};
    expect(denormalize(input)).toEqual(input);
  });

  test('returns the input if undefined', () => {
    expect(denormalize(undefined, {}, {})).toEqual(undefined);
  });

  test('returns the input if string', () => {
    expect(denormalize('bob', '', {})).toEqual('bob');
  });

  test('denormalizes entities', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    expect(denormalize(['1', '2'], [Tacos], entities)).toMatchSnapshot();
  });

  test('denormalizes without entities fills undefined', () => {
    expect(denormalize({ data: '1' }, { data: Tacos }, {})).toMatchSnapshot();
    expect(
      denormalize(fromJS({ data: '1' }), { data: Tacos }, {}),
    ).toMatchSnapshot();
    expect(denormalize('1', Tacos, {})).toEqual(undefined);
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

  test('denormalizes suspends when symbol contains DELETED string', () => {
    const entities = {
      Tacos: {
        1: Symbol('ENTITY WAS DELETED'),
      },
    };
    expect(denormalize('1', Tacos, entities)).toEqual(expect.any(Symbol));
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
      denormalize([{ data: 1 }, { data: 2 }], [{ data: Tacos }], {}),
    ).toEqual([]);*/
    expect(
      denormalize([{ data: 1 }, { data: 2 }], [{ data: Tacos }], entities),
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

  test('denormalizes where id is only in key', () => {
    expect(
      denormalize(
        {
          1: { type: 'foo' },
          2: { type: 'bar' },
        },
        new schema.Values(Tacos),
        {},
      ),
    ).toMatchSnapshot();
  });
});
