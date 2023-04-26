// eslint-env jest
import { inferResults, normalize, WeakEntityMap } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';
import { fromJS, Record } from 'immutable';

import { denormalizeSimple as denormalize } from './denormalize';
import WeakListMap from './legacy-compat/WeakListMap';
import { AbstractInstanceType } from '../..';
import { schema } from '../..';
import Entity from '../Entity';

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

const values = <T extends { [k: string]: any }>(obj: T) =>
  Object.keys(obj).map(key => obj[key]);

class Tacos extends IDEntity {
  readonly name: string = '';
  readonly alias: string | undefined = undefined;
}

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
  beforeEach(() => (warnSpy = jest.spyOn(console, 'warn')));

  test('throws without a key option', () => {
    // @ts-expect-error
    expect(() => new schema.Collection(new schema.Array(Todo), {})).toThrow();
  });

  test('should throw a custom error if data loads with string unexpected value', () => {
    function normalizeBad() {
      normalize('abc', userTodos);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with string unexpected value', () => {
    function normalizeBad() {
      normalize(null, userTodos.push);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with string unexpected value', () => {
    function normalizeBad() {
      // @ts-expect-error
      userTodos.normalize(
        [],
        undefined,
        '',
        () => undefined,
        () => undefined,
        {},
      );
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('normalizes nested collections', () => {
    const state = normalize(
      {
        id: '1',
        username: 'bob',
        todos: [{ id: '5', title: 'finish collections' }],
      },
      User,
    );
    expect(state).toMatchSnapshot();
    //const a: string | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes top level collections', () => {
    const state = normalize(
      [{ id: '5', title: 'finish collections' }],
      userTodos,
      [{ userId: '1' }],
    );
    expect(state).toMatchSnapshot();
    //const a: string[] | undefined = state.result;
    // @ts-expect-error
    const b: Record<any, any> | undefined = state.result;
  });

  test('normalizes already processed entities', () => {
    const state = normalize(
      {
        id: '1',
        username: 'bob',
        todos: ['5', '6'],
      },
      User,
    );
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
      [{ id: '10', title: 'create new items' }],
      User.schema.todos.push,
      [{ userId: '1' }],
      init.entities,
      init.indexes,
      init.entityMeta,
    );
    expect(state).toMatchSnapshot();
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
      denormalize(normalizeNested.result, User, normalizeNested.entities),
    ).toMatchSnapshot();
  });

  test('denormalizes top level collections', () => {
    expect(
      denormalize('{"userId":"1"}', userTodos, normalizeNested.entities),
    ).toMatchSnapshot();
  });

  describe('caching', () => {
    const entityCache = {};
    const resultCache = new WeakEntityMap();
    test('denormalizes nested and top level share referential equality', () => {
      const todos = denormalize(
        '{"userId":"1"}',
        userTodos,
        normalizeNested.entities,
        entityCache,
        resultCache,
        [{ userId: '1' }],
      );
      const user = denormalize(
        normalizeNested.result,
        User,
        normalizeNested.entities,
        entityCache,
        resultCache,
      );
      expect(user).toBeDefined();
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol' || !user) return;
      expect(todos).toBe(user.todos);
    });

    test('push updates cache', () => {
      const pushedState = normalize(
        [{ id: '10', title: 'create new items' }],
        User.schema.todos.push,
        [{ userId: '1' }],
        normalizeNested.entities,
        normalizeNested.indexes,
        normalizeNested.entityMeta,
      );
      const todos = denormalize(
        '{"userId":"1"}',
        userTodos,
        pushedState.entities,
        entityCache,
        resultCache,
        [{ userId: '1' }],
      );
      const user = denormalize(
        normalizeNested.result,
        User,
        pushedState.entities,
        entityCache,
        resultCache,
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
        [{ id: '2', title: 'from the start' }],
        User.schema.todos.unshift,
        [{ userId: '1' }],
        normalizeNested.entities,
        normalizeNested.indexes,
        normalizeNested.entityMeta,
      );
      const todos = denormalize(
        '{"userId":"1"}',
        userTodos,
        unshiftState.entities,
        entityCache,
        resultCache,
        [{ userId: '1' }],
      );
      const user = denormalize(
        normalizeNested.result,
        User,
        unshiftState.entities,
        entityCache,
        resultCache,
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
      const todos = denormalize(
        [{ id: '2', title: 'from the start' }],
        userTodos.unshift,
        {},
        entityCache,
        resultCache,
        [{ id: '1' }],
      );
      expect(todos).toBeDefined();
      expect(todos).not.toEqual(expect.any(Symbol));
      if (typeof todos === 'symbol' || !todos) return;
      expect(todos[0].title).toBe('from the start');
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
      const todos = denormalize(
        { id: '2', title: 'from the start' },
        userTodos.unshift,
        {},
        entityCache,
        resultCache,
        [{ id: '1' }],
      );
      expect(todos).toBeDefined();
      expect(todos).not.toEqual(expect.any(Symbol));
      if (typeof todos === 'symbol' || !todos) return;
      //expect(todos.title).toBe('from the start');
      expect(todos).toMatchInlineSnapshot(`
        {
          "id": "2",
          "title": "from the start",
        }
      `);
    });
  });
});
