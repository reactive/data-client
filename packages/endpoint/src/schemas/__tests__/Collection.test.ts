// eslint-env jest
import { initialState, State } from '@data-client/core';
import { normalize, denormalize, MemoCache } from '@data-client/normalizr';
import { ArticleResource, IDEntity } from '__tests__/new';
import { Record } from 'immutable';

import { SimpleMemoCache } from './denormalize';
import { PolymorphicInterface } from '../..';
import { schema, Collection, Union } from '../..';
import PolymorphicSchema from '../Polymorphic';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class Todo extends IDEntity {
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

class User extends IDEntity {
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: new Collection(new schema.Array(Todo), {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

const userTodos = new Collection(new schema.Array(Todo), {
  argsKey: ({ userId }: { userId: string }) => ({
    userId,
  }),
});

test('key works with custom schema', () => {
  class CustomArray extends PolymorphicSchema {
    declare schema: any;
    normalize(
      input: any,
      parent: any,
      key: any,
      args: any[],
      visit: any,
      snapshot: any,
    ): any {
      return input.map((value, index) =>
        this.normalizeValue(value, parent, key, args, visit),
      );
    }

    denormalize(
      input: any,
      args: any[],
      unvisit: (schema: any, input: any) => any,
    ) {
      return input.map ?
          input.map((entityOrId: any) =>
            this.denormalizeValue(entityOrId, unvisit),
          )
        : input;
    }

    queryKey(args: unknown, unvisit: unknown, delegate: unknown): any {
      return undefined;
    }

    _normalizeNullable(): any {}

    _denormalizeNullable(): any {}
  }

  const collection = new Collection(new CustomArray(Todo));
  expect(collection.key).toBe('(Todo)');
});

describe(`${schema.Collection.name} normalization`, () => {
  let warnSpy: jest.Spied<typeof console.warn>;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() => {
    (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {});
  });

  test('should throw a custom error if data loads with string unexpected value', () => {
    function normalizeBad() {
      normalize(userTodos, 'abc');
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with string unexpected value', () => {
    function normalizeBad() {
      normalize(userTodos.push, null);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with args of unexpected value', () => {
    function normalizeBad() {
      userTodos.normalize(
        [],
        undefined as any,
        '',
        [],
        () => undefined,
        {} as any,
      );
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('normalizes nested collections', () => {
    const state = normalize(User, {
      id: '1',
      username: 'bob',
      todos: [{ id: '5', title: 'finish collections' }],
    });
    expect(state).toMatchSnapshot();
    //const a: string | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes top level collections', () => {
    const state = normalize(
      userTodos,
      [{ id: '5', title: 'finish collections' }],
      [{ userId: '1' }],
    );
    expect(state).toMatchSnapshot();
    //const a: string[] | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes top level collections (no args)', () => {
    const state = normalize(
      new Collection(new schema.Array(Todo)),
      [{ id: '5', title: 'finish collections' }],
      [{ userId: '1' }],
    );
    expect(state).toMatchSnapshot();
    //const a: string[] | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes already processed entities', () => {
    const state = normalize(User, {
      id: '1',
      username: 'bob',
      todos: ['5', '6'],
    });
    expect(state).toMatchSnapshot();
  });

  describe('polymorphism', () => {
    class User extends IDEntity {
      type = 'users';
    }
    class Group extends IDEntity {
      type = 'groups';
    }
    const collection = new Collection(
      new schema.Array(
        {
          users: User,
          groups: Group,
        },
        'type',
      ),
    );
    const collectionUnion = new Collection([
      new Union(
        {
          users: User,
          groups: Group,
        },
        'type',
      ),
    ]);

    test('generates polymorphic key', () => {
      expect(collection.key).toBe('[User;Group]');
      expect(collectionUnion.key).toBe('[User;Group]');
    });

    test('works with polymorphic members', () => {
      const { entities, result } = normalize(
        collection,
        [
          { id: '1', type: 'users' },
          { id: '2', type: 'groups' },
        ],
        [{ fakeFilter: false }],
      );
      expect(result).toMatchSnapshot();
      expect(entities).toMatchSnapshot();
    });
    test('works with Union members', () => {
      const { entities, result } = normalize(
        collectionUnion,
        [
          { id: '1', type: 'users' },
          { id: '2', type: 'groups' },
        ],
        [{ fakeFilter: false }],
      );
      expect(result).toMatchSnapshot();
      expect(entities).toMatchSnapshot();
    });

    test('remove works with Union members', () => {
      const collectionPK = collectionUnion.pk({}, {}, '', [
        { completed: false },
      ]);
      const init: State<unknown> = {
        ...initialState,
        entities: {
          [collectionUnion.key]: {
            [collectionPK]: [
              { id: '1', schema: 'users' },
              { id: '2', schema: 'groups' },
              { id: '3', schema: 'groups' },
            ],
          },
          User: {
            '1': {
              id: '1',
              type: 'users',
            },
          },
          Group: {
            '2': {
              id: '2',
              type: 'groups',
            },
            '3': {
              id: '3',
              type: 'groups',
            },
          },
        },
        entitiesMeta: {
          [collectionUnion.key]: {
            [collectionPK]: {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
          },
          User: {
            '1': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
          },
          Group: {
            '2': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '3': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
          },
        },
        indexes: {},
      };
      const state = normalize(
        collectionUnion.remove,
        { id: '1', type: 'users' },
        [{ completed: false }],
        init,
      );
      expect(state.entities[collectionUnion.key]?.[collectionPK]).toEqual([
        { id: '2', schema: 'groups' },
        { id: '3', schema: 'groups' },
      ]);
    });

    test('remove works updates the correct collections', () => {
      const init = {
        entities: {
          [collectionUnion.key]: {
            // Collection for userId: '1', completed: true
            '{"userId":"1","completed":"true"}': [
              { id: '1', schema: 'users' },
              { id: '2', schema: 'groups' },
            ],
            // Collection for userId: '1', completed: false
            '{"userId":"1","completed":"false"}': [
              { id: '3', schema: 'users' },
              { id: '4', schema: 'groups' },
            ],
            // Collection for userId: '1' (no completed filter)
            '{"userId":"1"}': [
              { id: '1', schema: 'users' },
              { id: '3', schema: 'users' },
            ],
            // Collection for userId: '2'
            '{"userId":"2"}': [{ id: '5', schema: 'users' }],
            // Collection for userId: '1', completed: true, priority: high (additional arg)
            '{"userId":"1","completed":"true","priority":"high"}': [
              { id: '1', schema: 'users' },
              { id: '2', schema: 'groups' },
            ],
            // Collection for userId: '1', completed: true, priority: low (additional arg)
            '{"userId":"1","completed":"true","priority":"low"}': [
              { id: '3', schema: 'users' },
              { id: '4', schema: 'groups' },
            ],
          },
          User: {
            '1': {
              id: '1',
              type: 'users',
              userId: '1',
              completed: true,
              priority: 'high',
            },
            '3': {
              id: '3',
              type: 'users',
              userId: '1',
              completed: false,
              priority: 'low',
            },
            '5': {
              id: '5',
              type: 'users',
              userId: '2',
              completed: false,
            },
          },
          Group: {
            '2': {
              id: '2',
              type: 'groups',
              userId: '1',
              completed: true,
              priority: 'high',
            },
            '4': {
              id: '4',
              type: 'groups',
              userId: '1',
              completed: false,
              priority: 'low',
            },
          },
        },
        entitiesMeta: {
          [collectionUnion.key]: {
            '{"userId":"1","completed":"true"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '{"userId":"1","completed":"false"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '{"userId":"1"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '{"userId":"2"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '{"userId":"1","completed":"true","priority":"high"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
            '{"userId":"1","completed":"true","priority":"low"}': {
              date: 1557831718135,
              expiresAt: Infinity,
              fetchedAt: 0,
            },
          },
          User: {
            '1': { date: 1557831718135, expiresAt: Infinity, fetchedAt: 0 },
            '3': { date: 1557831718135, expiresAt: Infinity, fetchedAt: 0 },
            '5': { date: 1557831718135, expiresAt: Infinity, fetchedAt: 0 },
          },
          Group: {
            '2': { date: 1557831718135, expiresAt: Infinity, fetchedAt: 0 },
            '4': { date: 1557831718135, expiresAt: Infinity, fetchedAt: 0 },
          },
        },
        indexes: {},
      };

      // Remove a union member with userId: '1' and completed: true
      // This should remove from collections that match userId: '1' and optionally have completed: true
      const state = normalize(
        collectionUnion.remove,
        { id: '1', type: 'users' },
        [{ userId: '1', completed: true }],
        init,
      );

      // Should remove from collections that match the args:
      // - '{"userId":"1","completed":"true"}' (exact match)
      // - '{"userId":"1"}' (partial match - has userId: '1', missing completed)
      // Should NOT remove from:
      // - '{"userId":"1","completed":"false"}' (conflicting completed value)
      // - '{"userId":"2"}' (different userId)
      // - '{"userId":"1","completed":"true","priority":"high"}' (has additional priority arg)
      // - '{"userId":"1","completed":"true","priority":"low"}' (has additional priority arg)
      expect(
        state.entities[collectionUnion.key][
          '{"userId":"1","completed":"true"}'
        ],
      ).toEqual([{ id: '2', schema: 'groups' }]);
      expect(
        state.entities[collectionUnion.key][
          '{"userId":"1","completed":"false"}'
        ],
      ).toEqual([
        { id: '3', schema: 'users' },
        { id: '4', schema: 'groups' },
      ]);
      expect(state.entities[collectionUnion.key]['{"userId":"1"}']).toEqual([
        { id: '3', schema: 'users' },
      ]);
      expect(state.entities[collectionUnion.key]['{"userId":"2"}']).toEqual([
        { id: '5', schema: 'users' },
      ]);
      expect(
        state.entities[collectionUnion.key][
          '{"userId":"1","completed":"true","priority":"high"}'
        ],
      ).toEqual([
        { id: '1', schema: 'users' },
        { id: '2', schema: 'groups' },
      ]); // Should remain unchanged (has additional priority arg)
      expect(
        state.entities[collectionUnion.key][
          '{"userId":"1","completed":"true","priority":"low"}'
        ],
      ).toEqual([
        { id: '3', schema: 'users' },
        { id: '4', schema: 'groups' },
      ]); // Should remain unchanged (has additional priority arg)
    });
  });

  test('normalizes push onto the end', () => {
    const init = {
      entities: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': ['5'],
        },
        Todo: {
          '5': {
            id: '5',
            title: 'finish collections',
          },
        },
        User: {
          '1': {
            id: '1',
            todos: '{"userId":"1"}',
            username: 'bob',
          },
        },
      },
      entitiesMeta: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        Todo: {
          '5': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        User: {
          '1': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
      },
      indexes: {},
    };
    const state = normalize(
      User.schema.todos.push,
      [{ id: '10', title: 'create new items' }],
      [{ userId: '1' }],
      init,
    );
    expect(state).toMatchSnapshot();
  });

  test('normalizes remove from collection', () => {
    const init = {
      entities: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': ['5', '6'],
        },
        Todo: {
          '5': {
            id: '5',
            title: 'finish collections',
          },
          '6': {
            id: '6',
            title: 'another todo',
          },
        },
        User: {
          '1': {
            id: '1',
            todos: '{"userId":"1"}',
            username: 'bob',
          },
        },
      },
      entitiesMeta: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        Todo: {
          '5': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
          '6': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        User: {
          '1': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
      },
      indexes: {},
    };
    const state = normalize(
      User.schema.todos.remove,
      { id: '5', title: 'finish collections' },
      [{ userId: '1' }],
      init,
    );
    expect(state.entities[User.schema.todos.key]['{"userId":"1"}']).toEqual([
      '6',
    ]);
  });

  test('normalizes remove from collection with multiple items', () => {
    const init = {
      entities: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': ['5', '6', '7'],
        },
        Todo: {
          '5': {
            id: '5',
            title: 'finish collections',
          },
          '6': {
            id: '6',
            title: 'another todo',
          },
          '7': {
            id: '7',
            title: 'third todo',
          },
        },
        User: {
          '1': {
            id: '1',
            todos: '{"userId":"1"}',
            username: 'bob',
          },
        },
      },
      entitiesMeta: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        Todo: {
          '5': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
          '6': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
          '7': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        User: {
          '1': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
      },
      indexes: {},
    };
    const state = normalize(
      User.schema.todos.remove,
      { id: '6', title: 'another todo' },
      [{ userId: '1' }],
      init,
    );
    expect(state.entities[User.schema.todos.key]['{"userId":"1"}']).toEqual([
      '5',
      '7',
    ]);
  });

  test('normalizes remove non-existent item from collection', () => {
    const init = {
      entities: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': ['5'],
        },
        Todo: {
          '5': {
            id: '5',
            title: 'finish collections',
          },
        },
        User: {
          '1': {
            id: '1',
            todos: '{"userId":"1"}',
            username: 'bob',
          },
        },
      },
      entitiesMeta: {
        [User.schema.todos.key]: {
          '{"userId":"1"}': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        Todo: {
          '5': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
        User: {
          '1': {
            date: 1557831718135,
            expiresAt: Infinity,
            fetchedAt: 0,
          },
        },
      },
      indexes: {},
    };
    const state = normalize(
      User.schema.todos.remove,
      { id: '99', title: 'non-existent todo' }, // non-existent id
      [{ userId: '1' }],
      init,
    );
    expect(state.entities[User.schema.todos.key]['{"userId":"1"}']).toEqual([
      '5',
    ]);
  });

  describe('push should add only to collections matching filterArgumentKeys', () => {
    const initializingSchema = new Collection([Todo]);
    let state = {
      ...initialState,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'create new items' }],
        [{ userId: '1' }],
        initialState,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'create new items' }],
        [{ userId: '1', ignoredMe: '5' }],
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '20', title: 'second user' }],
        [{ userId: '2' }],
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [
          { id: '10', title: 'create new items' },
          { id: '20', title: 'the ignored one' },
        ],
        [{}],
        state,
      ),
    };
    function validate(sch: schema.Collection<(typeof Todo)[]>) {
      expect(
        (
          denormalize(
            sch,
            JSON.stringify({ userId: '1' }),
            state.entities,
          ) as any
        )?.length,
      ).toBe(1);
      const testState = {
        ...state,
        ...normalize(
          sch.push,
          [{ id: '30', title: 'pushed to the end' }],
          [{ userId: '1' }],
          state,
        ),
      };
      function getResponse(...args: any) {
        return denormalize(
          sch,
          sch.pk(undefined, undefined, '', args),
          testState.entities,
        ) as any;
      }
      const userOne = getResponse({ userId: '1' });
      if (!userOne || typeof userOne === 'symbol')
        throw new Error('should have a value');
      expect(userOne.length).toBe(2);
      expect(userOne[1].title).toBe('pushed to the end');

      expect(getResponse({}).length).toBe(3);
      expect(getResponse({ ignoredMe: '5', userId: '1' })?.length).toBe(2);
      expect(getResponse({ userId: '2' })?.length).toBe(1);
    }

    it('should work with function form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys(key) {
          return key.startsWith('ignored');
        },
      });
      validate(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: /ignored/,
      });
      validate(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: ['ignoredMe'],
      });
      validate(sch);
    });
    it('should work with full createCollectionFilter form', () => {
      const sch = new Collection([Todo], {
        createCollectionFilter:
          (...args) =>
          collectionKey =>
            Object.entries(collectionKey).every(
              ([key, value]) =>
                key.startsWith('ignored') ||
                // strings are canonical form. See pk() above for value transformation
                `${args[0]?.[key]}` === value ||
                `${args[1]?.[key]}` === value,
            ),
      });
      validate(sch);
    });
    it('should work with function override of nonFilterArgumentKeys', () => {
      class MyCollection<
        S extends any[] | PolymorphicInterface = any,
        Parent extends any[] =
          | []
          | [urlParams: { [k: string]: any }]
          | [urlParams: { [k: string]: any }, body: { [k: string]: any }],
      > extends schema.Collection<S, Parent> {
        nonFilterArgumentKeys(key: string) {
          return key.startsWith('ignored');
        }
      }
      const sch = new MyCollection([Todo]);
      validate(sch);
    });
    it('should work with function override of createCollectionFilter', () => {
      class MyCollection<
        S extends any[] | PolymorphicInterface = any,
        Parent extends any[] =
          | []
          | [urlParams: { [k: string]: any }]
          | [urlParams: { [k: string]: any }, body: { [k: string]: any }],
      > extends schema.Collection<S, Parent> {
        createCollectionFilter(...args: Parent) {
          return (collectionKey: { [k: string]: string }) =>
            Object.entries(collectionKey).every(
              ([key, value]) =>
                key.startsWith('ignored') ||
                // strings are canonical form. See pk() above for value transformation
                `${args[0][key]}` === value ||
                `${args[1]?.[key]}` === value,
            );
        }
      }
      const sch = new MyCollection([Todo]);
      validate(sch);
    });
  });

  describe('remove should remove only from collections matching filterArgumentKeys', () => {
    const initializingSchema = new Collection([Todo]);
    let state = {
      ...initialState,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'create new items' }],
        [{ userId: '1' }],
        initialState,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '20', title: 'second user' }],
        [{ userId: '2' }],
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [
          { id: '10', title: 'create new items' },
          { id: '20', title: 'the ignored one' },
        ],
        [{}],
        state,
      ),
    };
    function validateRemove(sch: schema.Collection<(typeof Todo)[]>) {
      expect(
        (
          denormalize(
            sch,
            JSON.stringify({ userId: '1' }),
            state.entities,
          ) as any
        )?.length,
      ).toBe(1);
      const testState = {
        ...state,
        ...normalize(
          sch.remove,
          { id: '10', title: 'create new items' },
          [{ userId: '1' }],
          state,
        ),
      };
      function getResponse(...args: any) {
        return denormalize(
          sch,
          sch.pk(undefined, undefined, '', args),
          testState.entities,
        ) as any;
      }
      const userOne = getResponse({ userId: '1' });
      if (!userOne || typeof userOne === 'symbol')
        throw new Error('should have a value');
      expect(userOne.length).toBe(0);

      expect(getResponse({}).length).toBe(1); // only '20' remains
      expect(getResponse({ userId: '2' })?.length).toBe(1); // '20' remains
    }

    it('should work with function form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys(key) {
          return key.startsWith('ignored');
        },
      });
      validateRemove(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: /ignored/,
      });
      validateRemove(sch);
    });
    it('should work with array form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: ['ignoredMe'],
      });
      validateRemove(sch);
    });
  });

  describe('move should remove from old collection and add to new', () => {
    const initializingSchema = new Collection([Todo]);

    it('moves entity between Array collections', () => {
      // Set up two collections: userId '1' has [10], userId '2' has [20]
      let state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [{ id: '10', userId: 1, title: 'movable todo' }],
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          initializingSchema,
          [{ id: '20', userId: 2, title: 'other todo' }],
          [{ userId: '2' }],
          state,
        ),
      };

      // Verify initial state
      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '1' }),
          state.entities,
        ),
      ).toHaveLength(1);
      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '2' }),
          state.entities,
        ),
      ).toHaveLength(1);

      // Move todo 10 from userId '1' to userId '2'
      // Simulates: PATCH /todos/10 body: { userId: 2 }
      // Server responds with updated entity
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          { id: '10', userId: 2, title: 'movable todo' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      // userId '1' should now be empty
      const userOneList = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '1' }),
        moveState.entities,
      ) as any;
      expect(userOneList).toHaveLength(0);

      // userId '2' should now have both
      const userTwoList = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(userTwoList).toHaveLength(2);
      expect(userTwoList.map((t: any) => t.id)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
    });

    it('no-op when entity stays in same collection', () => {
      const state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [{ id: '10', userId: 1, title: 'stays here' }],
          [{ userId: '1' }],
          initialState,
        ),
      };

      // Move with same userId - should not change collections
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          { id: '10', userId: 1, title: 'stays here updated' },
          [{ id: '10' }, { userId: '1' }],
          state,
        ),
      };

      const userOneList = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '1' }),
        moveState.entities,
      ) as any;
      expect(userOneList).toHaveLength(1);
      expect(userOneList[0].title).toBe('stays here updated');
    });

    it('handles single-arg endpoint (all values in one arg)', () => {
      let state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [{ id: '10', userId: 1, title: 'single arg' }],
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          initializingSchema,
          [{ id: '20', userId: 2, title: 'other' }],
          [{ userId: '2' }],
          state,
        ),
      };

      // Single arg containing both id and new userId
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          { id: '10', userId: 2, title: 'single arg' },
          [{ id: '10', userId: '2' }],
          state,
        ),
      };

      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '1' }),
          moveState.entities,
        ),
      ).toHaveLength(0);
      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '2' }),
          moveState.entities,
        ),
      ).toHaveLength(2);
    });

    it('handles entity not in store yet', () => {
      // Entity doesn't exist yet - should only add, not remove
      const state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [{ id: '20', userId: 2, title: 'existing' }],
          [{ userId: '2' }],
          initialState,
        ),
      };

      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          { id: '10', userId: 2, title: 'new entity' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      const userTwoList = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(userTwoList).toHaveLength(2);
    });
  });

  describe('move should remove from old Values collection and add to new', () => {
    const valuesSchema = new Collection(new schema.Values(Todo));

    it('types remove and move as Collection schemas for Values', () => {
      type IsNever<T> = [T] extends [never] ? true : false;
      const removeIsNever: IsNever<typeof valuesSchema.remove> = false;
      const moveIsNever: IsNever<typeof valuesSchema.move> = false;

      expect(removeIsNever).toBe(false);
      expect(moveIsNever).toBe(false);
    });

    it('moves entity between Values collections', () => {
      let state = {
        ...initialState,
        ...normalize(
          valuesSchema,
          { '10': { id: '10', userId: 1, title: 'movable todo' } },
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          valuesSchema,
          { '20': { id: '20', userId: 2, title: 'other todo' } },
          [{ userId: '2' }],
          state,
        ),
      };

      // Verify initial state
      expect(
        Object.keys(
          denormalize(
            valuesSchema,
            JSON.stringify({ userId: '1' }),
            state.entities,
          ) as any,
        ),
      ).toHaveLength(1);
      expect(
        Object.keys(
          denormalize(
            valuesSchema,
            JSON.stringify({ userId: '2' }),
            state.entities,
          ) as any,
        ),
      ).toHaveLength(1);

      // Move todo 10 from userId '1' to userId '2'
      const moveState = {
        ...state,
        ...normalize(
          valuesSchema.move,
          { id: '10', userId: 2, title: 'movable todo' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      // userId '1' should now be empty
      const userOneValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '1' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userOneValues)).toHaveLength(0);

      // userId '2' should now have both
      const userTwoValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userTwoValues)).toHaveLength(2);
      expect(Object.keys(userTwoValues)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
    });

    it('no-op when entity stays in same Values collection', () => {
      const state = {
        ...initialState,
        ...normalize(
          valuesSchema,
          { '10': { id: '10', userId: 1, title: 'stays here' } },
          [{ userId: '1' }],
          initialState,
        ),
      };

      // Move with same userId - should not change collections
      const moveState = {
        ...state,
        ...normalize(
          valuesSchema.move,
          { id: '10', userId: 1, title: 'stays here updated' },
          [{ id: '10' }, { userId: '1' }],
          state,
        ),
      };

      const userOneValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '1' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userOneValues)).toHaveLength(1);
      expect(userOneValues['10'].title).toBe('stays here updated');
    });

    it('handles entity not in store yet (Values)', () => {
      const state = {
        ...initialState,
        ...normalize(
          valuesSchema,
          { '20': { id: '20', userId: 2, title: 'existing' } },
          [{ userId: '2' }],
          initialState,
        ),
      };

      const moveState = {
        ...state,
        ...normalize(
          valuesSchema.move,
          { id: '10', userId: 2, title: 'new entity' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      const userTwoValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userTwoValues)).toHaveLength(2);
    });

    it('handles single-arg endpoint (Values)', () => {
      let state = {
        ...initialState,
        ...normalize(
          valuesSchema,
          { '10': { id: '10', userId: 1, title: 'single arg' } },
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          valuesSchema,
          { '20': { id: '20', userId: 2, title: 'other' } },
          [{ userId: '2' }],
          state,
        ),
      };

      // Single arg containing both id and new userId
      const moveState = {
        ...state,
        ...normalize(
          valuesSchema.move,
          { id: '10', userId: 2, title: 'single arg' },
          [{ id: '10', userId: '2' }],
          state,
        ),
      };

      expect(
        Object.keys(
          denormalize(
            valuesSchema,
            JSON.stringify({ userId: '1' }),
            moveState.entities,
          ) as any,
        ),
      ).toHaveLength(0);
      expect(
        Object.keys(
          denormalize(
            valuesSchema,
            JSON.stringify({ userId: '2' }),
            moveState.entities,
          ) as any,
        ),
      ).toHaveLength(2);
    });

    it('moves one entity from multi-item Values collection, keeps others', () => {
      // Source collection has 2 items; only one moves out
      let state = {
        ...initialState,
        ...normalize(
          valuesSchema,
          {
            '10': { id: '10', userId: 1, title: 'will move' },
            '11': { id: '11', userId: 1, title: 'stays put' },
          },
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          valuesSchema,
          { '20': { id: '20', userId: 2, title: 'already here' } },
          [{ userId: '2' }],
          state,
        ),
      };

      // Move only item 10 from userId '1' to userId '2'
      const moveState = {
        ...state,
        ...normalize(
          valuesSchema.move,
          { id: '10', userId: 2, title: 'will move' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      // userId '1' should keep item 11
      const userOneValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '1' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userOneValues)).toHaveLength(1);
      expect(Object.keys(userOneValues)).toEqual(['11']);

      // userId '2' should now have both 20 and 10
      const userTwoValues = denormalize(
        valuesSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(Object.keys(userTwoValues)).toHaveLength(2);
      expect(Object.keys(userTwoValues)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
    });
  });

  describe('move should respect nonFilterArgumentKeys', () => {
    // Entities must include filter-relevant fields (userId) since move
    // uses entity values to determine collection membership
    function validateMove(sch: schema.Collection<(typeof Todo)[]>) {
      let state = {
        ...initialState,
        ...normalize(
          sch,
          [{ id: '10', userId: 1, title: 'create new items' }],
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          sch,
          [{ id: '10', userId: 1, title: 'create new items' }],
          [{ userId: '1', ignoredMe: '5' }],
          state,
        ),
      };
      state = {
        ...state,
        ...normalize(
          sch,
          [{ id: '20', userId: 2, title: 'second user' }],
          [{ userId: '2' }],
          state,
        ),
      };
      state = {
        ...state,
        ...normalize(
          sch,
          [
            { id: '10', userId: 1, title: 'create new items' },
            { id: '20', userId: 2, title: 'the ignored one' },
          ],
          [{}],
          state,
        ),
      };
      expect(
        (
          denormalize(
            sch,
            JSON.stringify({ userId: '1' }),
            state.entities,
          ) as any
        )?.length,
      ).toBe(1);
      // Move todo 10 from userId '1' to userId '2'
      const testState = {
        ...state,
        ...normalize(
          sch.move,
          { id: '10', userId: 2, title: 'create new items' },
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };
      function getResponse(...args: any) {
        return denormalize(
          sch,
          sch.pk(undefined, undefined, '', args),
          testState.entities,
        ) as any;
      }
      // userId '1' should have 0 items (removed)
      const userOne = getResponse({ userId: '1' });
      if (!userOne || typeof userOne === 'symbol')
        throw new Error('should have a value');
      expect(userOne.length).toBe(0);

      // unfiltered collection should keep both (both match add and remove so neither applies)
      expect(getResponse({}).length).toBe(2);
      // userId '1' with ignored key should also be empty (ignored key doesn't affect filter)
      expect(getResponse({ ignoredMe: '5', userId: '1' })?.length).toBe(0);
      // userId '2' should have both 10 and 20
      expect(getResponse({ userId: '2' })?.length).toBe(2);
    }

    it('should work with function form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys(key) {
          return key.startsWith('ignored');
        },
      });
      validateMove(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: /ignored/,
      });
      validateMove(sch);
    });
    it('should work with array form', () => {
      const sch = new Collection([Todo], {
        nonFilterArgumentKeys: ['ignoredMe'],
      });
      validateMove(sch);
    });
  });

  describe('move should update the correct collections with multiple args', () => {
    const initializingSchema = new Collection([Todo]);
    let state = {
      ...initialState,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'todo A', userId: 1, completed: true }],
        [{ userId: '1', completed: 'true' }],
        initialState,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '20', title: 'todo B', userId: 1, completed: false }],
        [{ userId: '1', completed: 'false' }],
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [
          { id: '10', title: 'todo A', userId: 1 },
          { id: '20', title: 'todo B', userId: 1 },
        ],
        [{ userId: '1' }],
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '30', title: 'todo C', userId: 2, completed: false }],
        [{ userId: '2' }],
        state,
      ),
    };

    it('moves from matching collections and adds to correct ones', () => {
      // Move todo 10 from userId '1', completed 'true' to userId '2', completed 'true'
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          { id: '10', title: 'todo A', userId: 2, completed: true },
          [{ id: '10' }, { userId: '2', completed: 'true' }],
          state,
        ),
      };
      function getResponse(...args: any) {
        return denormalize(
          initializingSchema,
          initializingSchema.pk(undefined, undefined, '', args),
          moveState.entities,
        ) as any;
      }
      // userId '1', completed 'true' → should be empty (removed)
      expect(getResponse({ userId: '1', completed: 'true' })?.length).toBe(0);
      // userId '1', completed 'false' → unchanged
      expect(getResponse({ userId: '1', completed: 'false' })?.length).toBe(1);
      // userId '1' (no completed filter) → should lose todo 10
      expect(getResponse({ userId: '1' })?.length).toBe(1);
      expect(getResponse({ userId: '1' })?.[0]?.id).toBe('20');
      // userId '2' → should gain todo 10
      expect(getResponse({ userId: '2' })?.length).toBe(2);
    });
  });

  describe('move with array input format', () => {
    const initializingSchema = new Collection([Todo]);

    it('moves entity when input is an array', () => {
      let state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [{ id: '10', userId: 1, title: 'movable' }],
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          initializingSchema,
          [{ id: '20', userId: 2, title: 'existing' }],
          [{ userId: '2' }],
          state,
        ),
      };

      // Pass input as array (the Array.isArray(input) branch in normalizeMove)
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          [{ id: '10', userId: 2, title: 'movable' }],
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '1' }),
          moveState.entities,
        ),
      ).toHaveLength(0);
      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '2' }),
          moveState.entities,
        ),
      ).toHaveLength(2);
    });
  });

  describe('move with multi-entity array input', () => {
    const initializingSchema = new Collection([Todo]);

    it('moves entities with different memberships to correct collections', () => {
      // Set up three collections:
      //   userId '1' has [10, 11]
      //   userId '2' has [20]
      //   userId '3' has [30]
      let state = {
        ...initialState,
        ...normalize(
          initializingSchema,
          [
            { id: '10', userId: 1, title: 'todo A' },
            { id: '11', userId: 1, title: 'todo B' },
          ],
          [{ userId: '1' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          initializingSchema,
          [{ id: '20', userId: 2, title: 'existing in 2' }],
          [{ userId: '2' }],
          state,
        ),
      };
      state = {
        ...state,
        ...normalize(
          initializingSchema,
          [{ id: '30', userId: 3, title: 'existing in 3' }],
          [{ userId: '3' }],
          state,
        ),
      };

      // Move todo 10 → userId 2 and todo 11 → userId 3 in one array
      // Entity A (id 10): old userId=1, new userId=2
      // Entity B (id 11): old userId=1, new userId=3
      // Without per-entity filters, only the first entity's membership
      // would be used, causing incorrect add/remove decisions.
      const moveState = {
        ...state,
        ...normalize(
          initializingSchema.move,
          [
            { id: '10', userId: 2, title: 'todo A moved' },
            { id: '11', userId: 3, title: 'todo B moved' },
          ],
          [{ id: '10' }, { userId: '2' }],
          state,
        ),
      };

      // userId '1' should lose both
      expect(
        denormalize(
          initializingSchema,
          JSON.stringify({ userId: '1' }),
          moveState.entities,
        ),
      ).toHaveLength(0);
      // userId '2' should gain todo 10
      const user2 = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '2' }),
        moveState.entities,
      ) as any;
      expect(user2).toHaveLength(2);
      expect(user2.map((t: any) => t.id)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
      // userId '3' should gain todo 11
      const user3 = denormalize(
        initializingSchema,
        JSON.stringify({ userId: '3' }),
        moveState.entities,
      ) as any;
      expect(user3).toHaveLength(2);
      expect(user3.map((t: any) => t.id)).toEqual(
        expect.arrayContaining(['11', '30']),
      );
    });
  });

  describe('move with path-param-based collection keys not on entity', () => {
    // Entity does NOT store the collection filter param (group)
    class Item extends IDEntity {
      title = '';
      static key = 'Item';
    }

    const itemCollection = new Collection([Item]);

    it('moves entity between collections keyed by URL path param', () => {
      // Set up two collections keyed by 'group' (a URL path param, not on entity)
      let state = {
        ...initialState,
        ...normalize(
          itemCollection,
          [{ id: '10', title: 'movable item' }],
          [{ group: 'five' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          itemCollection,
          [{ id: '20', title: 'other item' }],
          [{ group: 'ten' }],
          state,
        ),
      };

      // Verify initial state
      expect(
        denormalize(
          itemCollection,
          JSON.stringify({ group: 'five' }),
          state.entities,
        ),
      ).toHaveLength(1);
      expect(
        denormalize(
          itemCollection,
          JSON.stringify({ group: 'ten' }),
          state.entities,
        ),
      ).toHaveLength(1);

      // Move item 10 from group 'five' to group 'ten'
      // args[0] = { group: 'five', id: '10' } (URL params identifying source)
      // args[1] = { group: 'ten' } (body with new values)
      const moveState = {
        ...state,
        ...normalize(
          itemCollection.move,
          { id: '10', title: 'movable item' },
          [{ group: 'five', id: '10' }, { group: 'ten' }],
          state,
        ),
      };

      // group 'five' should now be empty (removed)
      expect(
        denormalize(
          itemCollection,
          JSON.stringify({ group: 'five' }),
          moveState.entities,
        ),
      ).toHaveLength(0);

      // group 'ten' should now have both items
      const groupTen = denormalize(
        itemCollection,
        JSON.stringify({ group: 'ten' }),
        moveState.entities,
      ) as any;
      expect(groupTen).toHaveLength(2);
      expect(groupTen.map((i: any) => i.id)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
    });

    it('handles multi-param path where only one param changes', () => {
      // Collections keyed by both 'team' and 'group'
      let state = {
        ...initialState,
        ...normalize(
          itemCollection,
          [{ id: '10', title: 'movable' }],
          [{ team: 'alpha', group: 'five' }],
          initialState,
        ),
      };
      state = {
        ...state,
        ...normalize(
          itemCollection,
          [{ id: '20', title: 'dest item' }],
          [{ team: 'alpha', group: 'ten' }],
          state,
        ),
      };

      // Move item 10: same team, different group
      const moveState = {
        ...state,
        ...normalize(
          itemCollection.move,
          { id: '10', title: 'movable' },
          [{ team: 'alpha', group: 'five', id: '10' }, { group: 'ten' }],
          state,
        ),
      };

      expect(
        denormalize(
          itemCollection,
          JSON.stringify({ group: 'five', team: 'alpha' }),
          moveState.entities,
        ),
      ).toHaveLength(0);

      const destCollection = denormalize(
        itemCollection,
        JSON.stringify({ group: 'ten', team: 'alpha' }),
        moveState.entities,
      ) as any;
      expect(destCollection).toHaveLength(2);
    });
  });
});

describe(`${schema.Collection.name} denormalization`, () => {
  const normalizeNested = {
    entities: {
      [userTodos.key]: {
        '{"userId":"1"}': ['5'],
      },
      Todo: {
        '5': {
          id: '5',
          title: 'finish collections',
        },
      },
      User: {
        '1': {
          id: '1',
          todos: '{"userId":"1"}',
          username: 'bob',
        },
      },
    },
    entitiesMeta: {
      [userTodos.key]: {
        '{"userId":"1"}': {
          date: 1557831718135,
          expiresAt: Infinity,
          fetchedAt: 0,
        },
      },
      Todo: {
        '5': {
          date: 1557831718135,
          expiresAt: Infinity,
          fetchedAt: 0,
        },
      },
      User: {
        '1': {
          date: 1557831718135,
          expiresAt: Infinity,
          fetchedAt: 0,
        },
      },
    },
    indexes: {},
    result: '1',
  };

  test('denormalizes nested collections', () => {
    expect(
      denormalize(User, normalizeNested.result, normalizeNested.entities),
    ).toMatchSnapshot();
  });

  test('denormalizes top level collections', () => {
    expect(
      denormalize(userTodos, '{"userId":"1"}', normalizeNested.entities),
    ).toMatchSnapshot();
  });

  describe('caching', () => {
    const memo = new SimpleMemoCache();
    test('denormalizes nested and top level share referential equality', () => {
      const todos = memo.denormalize(
        userTodos,
        '{"userId":"1"}',
        normalizeNested.entities,

        [{ userId: '1' }],
      );
      const user = memo.denormalize(
        User,
        normalizeNested.result,
        normalizeNested.entities,
      );
      expect(user).toBeDefined();
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol' || !user) return;
      expect(todos).toBe(user.todos);
    });

    test('push updates cache', () => {
      const pushedState = normalize(
        User.schema.todos.push,
        [{ id: '10', title: 'create new items' }],
        [{ userId: '1' }],
        normalizeNested,
      );
      const todos = memo.denormalize(
        userTodos,
        '{"userId":"1"}',
        pushedState.entities,

        [{ userId: '1' }],
      );
      const user = memo.denormalize(
        User,
        normalizeNested.result,
        pushedState.entities,
        [{ id: '1' }],
      );
      expect(user).toBeDefined();
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol' || !user) return;
      expect(user.todos.length).toBe(2);
      expect(todos).toBe(user.todos);
    });

    test('unshift places at start', () => {
      const unshiftState = normalize(
        User.schema.todos.unshift,
        [{ id: '2', title: 'from the start' }],
        [{ userId: '1' }],
        normalizeNested,
      );
      const todos = memo.denormalize(
        userTodos,
        '{"userId":"1"}',
        unshiftState.entities,
        [{ userId: '1' }],
      );
      const user = memo.denormalize(
        User,
        normalizeNested.result,
        unshiftState.entities,
        [{ id: '1' }],
      );
      expect(user).toBeDefined();
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol' || !user) return;
      expect(user.todos.length).toBe(2);
      expect(todos).toBe(user.todos);
      expect(user.todos[0].title).toBe('from the start');
    });

    test('denormalizes unshift', () => {
      const todos = memo.denormalize(
        userTodos.unshift,
        [{ id: '2', title: 'from the start' }],
        {},
        [{ id: '1' }],
      );
      expect(todos).toBeDefined();
      expect(todos).not.toEqual(expect.any(Symbol));
      if (typeof todos === 'symbol' || !todos) return;
      //expect(todos[0].title).toBe('from the start'); TODO: once we get types based on parameters sent
      expect(todos).toMatchInlineSnapshot(`
        [
          Todo {
            "completed": false,
            "id": "2",
            "title": "from the start",
            "userId": 0,
          },
        ]
      `);
    });

    test('denormalizes unshift (single item)', () => {
      const todos = memo.denormalize(
        userTodos.unshift,
        { id: '2', title: 'from the start' },
        {},
        [{ id: '1' }],
      );
      expect(todos).toBeDefined();
      expect(todos).not.toEqual(expect.any(Symbol));
      if (typeof todos === 'symbol' || !todos) return;
      expect(todos.title).toBe('from the start');
      expect(todos).toMatchInlineSnapshot(`
        Todo {
          "completed": false,
          "id": "2",
          "title": "from the start",
          "userId": 0,
        }
      `);
    });

    test('remove updates cache', () => {
      const removedState = normalize(
        User.schema.todos.remove,
        { id: '5', title: 'finish collections' },
        [{ userId: '1' }],
        normalizeNested,
      );
      const todos = memo.denormalize(
        userTodos,
        '{"userId":"1"}',
        removedState.entities,
        [{ userId: '1' }],
      );
      const user = memo.denormalize(
        User,
        normalizeNested.result,
        removedState.entities,
        [{ id: '1' }],
      );
      expect(user).toBeDefined();
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol' || !user) return;
      expect(user.todos.length).toBe(0);
      expect(todos).toBe(user.todos);
    });

    test('denormalizes remove', () => {
      const todos = memo.denormalize(
        userTodos.remove,
        { id: '5', title: 'finish collections' },
        {},
        [{ userId: '1' }],
      );
      expect(todos).toBeDefined();
      expect(todos).not.toEqual(expect.any(Symbol));
      if (typeof todos === 'symbol' || !todos) return;
      expect(todos).toMatchInlineSnapshot(`
       Todo {
         "completed": false,
         "id": "5",
         "title": "finish collections",
         "userId": 0,
       }
      `);
    });
  });

  it('should buildQueryKey with matching args', () => {
    const memo = new MemoCache();
    const queryKey = memo.buildQueryKey(
      userTodos,
      [{ userId: '1' }],
      normalizeNested,
    );
    expect(queryKey).toBeDefined();
    // now ensure our queryKey is usable
    const results = denormalize(userTodos, queryKey, normalizeNested.entities);
    expect(results).toBeDefined();
    expect(results).toMatchInlineSnapshot(`
      [
        Todo {
          "completed": false,
          "id": "5",
          "title": "finish collections",
          "userId": 0,
        },
      ]
    `);
  });

  it('should buildQueryKey undefined when not in cache', () => {
    const memo = new MemoCache();
    const queryKey = memo.buildQueryKey(
      userTodos,
      [{ userId: '100' }],
      normalizeNested,
    );
    expect(queryKey).toBeUndefined();
  });

  it('should buildQueryKey undefined with nested Collection', () => {
    const memo = new MemoCache();
    const queryKey = memo.buildQueryKey(
      User.schema.todos,
      [{ userId: '1' }],
      normalizeNested,
    );
    expect(queryKey).toBeUndefined();
  });

  it('pk should serialize differently with nested args', () => {
    const filtersA = {
      search: {
        type: 'Coupon',
      },
    };
    const filtersB = {
      search: {
        type: 'Cashback',
      },
    };

    expect(
      ArticleResource.getList.schema.pk([], undefined, '', [filtersA]),
    ).not.toEqual(
      ArticleResource.getList.schema.pk([], undefined, '', [filtersB]),
    );
  });
});
