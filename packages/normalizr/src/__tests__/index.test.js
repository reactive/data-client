// eslint-env jest
import { Entity, schema, Values } from '@data-client/endpoint';
import { fromJS } from 'immutable';

import { normalize } from '../';
import { denormalize as denormalizeSimple } from '../denormalize/denormalize';
import { INVALID } from '../denormalize/symbol';
import MemoCached from '../memo/MemoCache';

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
      expect(() => normalize(Test, input)).toThrow();
    },
  );
  test.each([42, null, undefined, '42', () => {}])(
    `cannot normalize input that == %s`,
    input => {
      class Test extends IDEntity {}
      expect(() => normalize({ data: Test }, input)).toThrow();
    },
  );

  test('can normalize strings for entity (already processed)', () => {
    class Test extends IDEntity {}
    expect(normalize(new schema.Array(Test), ['42']).result).toEqual(['42']);
  });

  test('can normalize null schema with string response', () => {
    expect(normalize(null, '17,234').result).toEqual('17,234');
  });

  test('passthrough with undefined schema', () => {
    const input = {};
    expect(normalize(undefined, input).result).toBe(input);
  });

  test('passthrough with id in place of entity', () => {
    const input = { taco: '5' };
    expect(normalize({ taco: Tacos }, input).result).toStrictEqual(input);
  });

  test('cannot normalize with null input', () => {
    expect(() => normalize(Tacos, null)).toThrow(/null/);
  });

  test('passthrough primitive schema', () => {
    expect(normalize({ happy: 5 }, { happy: { bob: 5 } }).result).toStrictEqual(
      {
        happy: { bob: 5 },
      },
    );
  });

  test('can normalize string', () => {
    const mySchema = '';
    expect(normalize(mySchema, 'bob')).toMatchInlineSnapshot(`
      {
        "entities": {},
        "entitiesMeta": {},
        "indexes": {},
        "result": "bob",
      }
    `);
  });

  test('normalizes entities', () => {
    expect(
      normalize(
        [Tacos],
        [
          { id: '1', type: 'foo' },
          { id: '2', type: 'bar' },
        ],
      ),
    ).toMatchSnapshot();
  });

  test('normalizes schema with extra members', () => {
    expect(
      normalize(
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
      ),
    ).toMatchSnapshot();
  });

  test('normalizes schema with extra members but not set', () => {
    expect(
      normalize(
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
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
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
        { data: [MyTaco], alt: MyTaco },
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
          alt: { id: '2', type: 'bar2' },
        },
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
        { data: [MyTaco], alt: MyTaco },
        {
          data: [
            { id: '1', type: 'foo' },
            { id: '2', type: 'bar' },
          ],
          alt: { id: '2', type: 'bar2' },
        },
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

    expect(normalize(User, input)).toMatchSnapshot();
  });

  test('normalizes entities with circular references that fails validation', () => {
    class User extends IDEntity {
      static validate(processedEntity) {
        return 'this always fails';
      }
    }
    User.schema = { friends: [User] };

    const input = { id: '123', friends: [] };
    input.friends.push(input);

    expect(() => normalize(User, input)).toThrowErrorMatchingSnapshot();
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
    expect(normalize(Article, input)).toMatchSnapshot();
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
    expect(() => normalize(Article, input)).not.toThrow();
  });

  test('handles number ids when nesting', () => {
    class User extends IDEntity {}
    class Article extends IDEntity {
      title = '';
      static schema = {
        author: User,
      };
    }
    const input = Object.freeze({
      id: 123,
      title: 'A Great Article',
      author: {
        id: 8472,
        name: 'Paul',
      },
    });
    expect(normalize(Article, input).entities).toMatchSnapshot();
  });

  test('ignores null values', () => {
    class MyEntity extends IDEntity {}
    expect(normalize([MyEntity], [null])).toMatchSnapshot();
    expect(normalize([MyEntity], [undefined])).toMatchSnapshot();
    expect(normalize([MyEntity], [false])).toMatchSnapshot();
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

      static normalize(input, parent, key, args, visit, delegate) {
        const entity = { ...input };
        Object.keys(this.schema).forEach(key => {
          const schema = this.schema[key];
          entity[key] = visit(schema, input[key], input, key, args);
        });
        delegate.mergeEntity(this, this.pk(entity), entity);
        return {
          uuid: this.pk(entity),
          schema: this.key,
        };
      }
    }

    class Food extends MyEntity {}
    expect(
      normalize(Food, {
        uuid: '1234',
        name: 'tacos',
        children: [{ id: 4, name: 'lettuce' }],
      }),
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
      normalize(Recommendations, { user: { id: '456' } }, [{ id: '456' }]),
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
      normalize(Article, {
        id: '123',
        title: 'normalizr is great!',
        author: '1',
      }),
    ).toMatchSnapshot();

    expect(normalize({ user: User }, { user: '1' })).toMatchSnapshot();
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

    expect(() => normalize(Test, test)).not.toThrow();
  });
});

const memo = new MemoCached();
function denormalizeCachedValue(...args) {
  return memo.denormalize(...args).data;
}
describe.each([
  ['fast', denormalizeSimple],
  ['cached', denormalizeCachedValue],
])(`denormalize [%s]`, (_, denormalize) => {
  test('passthrough with undefined schema', () => {
    const input = {};
    expect(denormalize(undefined, input)).toEqual(input);
  });

  test('returns the input if undefined', () => {
    expect(denormalize({}, undefined, {})).toEqual(undefined);
  });

  test('returns the input if string', () => {
    expect(denormalize('', 'bob', {})).toEqual('bob');
  });

  test('denormalizes entities', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };
    expect(denormalize([Tacos], ['1', '2'], entities)).toMatchSnapshot();
  });

  test('denormalizes without entities fills undefined', () => {
    expect(denormalize({ data: Tacos }, { data: '1' }, {})).toMatchSnapshot();
    expect(
      denormalize({ data: Tacos }, fromJS({ data: '1' }), {}),
    ).toMatchSnapshot();
    expect(denormalize(Tacos, '1', {})).toEqual(undefined);
  });

  test('denormalizes ignoring unfound entities in arrays', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
      },
    };
    expect(denormalize([Tacos], ['1', '2'], entities)).toMatchSnapshot();
    expect(
      denormalize({ results: [Tacos] }, { results: ['1', '2'] }, entities),
    ).toMatchSnapshot();
  });

  test('denormalizes suspends when symbol contains INVALID string', () => {
    const entities = {
      Tacos: {
        1: Symbol('ENTITY WAS INVALID'),
      },
    };
    expect(denormalize(Tacos, '1', entities)).toEqual(expect.any(Symbol));
  });

  test('denormalizes ignoring deleted entities in arrays', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: INVALID,
      },
    };
    expect(denormalize([Tacos], ['1', '2'], entities)).toMatchSnapshot();
    expect(
      denormalize({ results: [Tacos] }, { results: ['1', '2'] }, entities),
    ).toMatchSnapshot();
  });

  test('denormalizes arrays with objects inside', () => {
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
      },
    };
    /*expect(
      denormalize([{ data: Tacos }],[{ data: 1 }, { data: 2 }],  {}),
    ).toEqual([]);*/
    expect(
      denormalize([{ data: Tacos }], [{ data: 1 }, { data: 2 }], entities),
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
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
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
          data: [Tacos],
          extra: '',
          page: {
            first: null,
            second: undefined,
            third: 0,
            complex: { complex: true, next: false },
          },
        },
        {
          data: ['1', '2'],
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
    expect(denormalize(Article, '123', entities)).toMatchSnapshot();
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
    expect(() => denormalize(Article, '123', entities)).toMatchSnapshot();
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
    expect(denormalize(Article, '123', entities)).toMatchSnapshot();
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
    expect(() => denormalize(Article, '123', entities)).not.toThrow();
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
      denormalize([Patron], normalizedData.result, normalizedData.entities),
    ).toMatchSnapshot();
  });

  test('denormalizes where id is only in key', () => {
    expect(
      denormalize(
        new Values(Tacos),
        {
          1: { type: 'foo' },
          2: { type: 'bar' },
        },
        {},
      ),
    ).toMatchSnapshot();
  });
});
