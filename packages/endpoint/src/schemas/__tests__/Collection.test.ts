// eslint-env jest
import { initialState } from '@data-client/core';
import { normalize, denormalize, MemoCache } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';
import { Record } from 'immutable';

import SimpleMemoCache from './denormalize';
import { PolymorphicInterface } from '../..';
import { schema } from '../..';

let dateSpy: jest.SpyInstance;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
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
    todos: new schema.Collection(new schema.Array(Todo), {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

const userTodos = new schema.Collection(new schema.Array(Todo), {
  argsKey: ({ userId }: { userId: string }) => ({
    userId,
  }),
});

describe(`${schema.Collection.name} normalization`, () => {
  let warnSpy: jest.SpyInstance;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() =>
    (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {}),
  );

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
        () => undefined,
        () => undefined,
        () => false,
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
      { args: [{ userId: '1' }] },
    );
    expect(state).toMatchSnapshot();
    //const a: string[] | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes top level collections (no args)', () => {
    const state = normalize(
      new schema.Collection(new schema.Array(Todo)),
      [{ id: '5', title: 'finish collections' }],
      { args: [{ userId: '1' }] },
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

  test('normalizes push onto the end', () => {
    const init = {
      entities: {
        'COLLECT:ArraySchema(Todo)': {
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
      entityMeta: {
        'COLLECT:ArraySchema(Todo)': {
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
    const state = normalize(
      User.schema.todos.push,
      [{ id: '10', title: 'create new items' }],
      { args: [{ userId: '1' }] },
      init,
    );
    expect(state).toMatchSnapshot();
  });

  describe('push should add only to collections matching filterArgumentKeys', () => {
    const initializingSchema = new schema.Collection([Todo]);
    let state = {
      ...initialState,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'create new items' }],
        { args: [{ userId: '1' }] },
        initialState,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '10', title: 'create new items' }],
        { args: [{ userId: '1', ignoredMe: '5' }] },
        state,
      ),
    };
    state = {
      ...state,
      ...normalize(
        initializingSchema,
        [{ id: '20', title: 'second user' }],
        { args: [{ userId: '2' }] },
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
        { args: [{}] },
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
          { args: [{ userId: '1' }] },
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
      const sch = new schema.Collection([Todo], {
        nonFilterArgumentKeys(key) {
          return key.startsWith('ignored');
        },
      });
      validate(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new schema.Collection([Todo], {
        nonFilterArgumentKeys: /ignored/,
      });
      validate(sch);
    });
    it('should work with RegExp form', () => {
      const sch = new schema.Collection([Todo], {
        nonFilterArgumentKeys: ['ignoredMe'],
      });
      validate(sch);
    });
    it('should work with full createCollectionFilter form', () => {
      const sch = new schema.Collection([Todo], {
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
});

describe(`${schema.Collection.name} denormalization`, () => {
  const normalizeNested = {
    entities: {
      'COLLECT:ArraySchema(Todo)': {
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
    entityMeta: {
      'COLLECT:ArraySchema(Todo)': {
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
        { args: [{ userId: '1' }] },
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
        { args: [{ userId: '1' }] },
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
  });

  it('should buildQueryKey with matching args', () => {
    const memo = new MemoCache();
    const queryKey = memo.buildQueryKey(
      '',
      userTodos,
      [{ userId: '1' }],
      normalizeNested.entities,
      {},
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
      '',
      userTodos,
      [{ userId: '100' }],
      normalizeNested.entities,
      {},
    );
    expect(queryKey).toBeUndefined();
  });

  it('should buildQueryKey undefined with nested Collection', () => {
    const memo = new MemoCache();
    const queryKey = memo.buildQueryKey(
      '',
      User.schema.todos,
      [{ userId: '1' }],
      normalizeNested.entities,
      {},
    );
    expect(queryKey).toBeUndefined();
  });
});
