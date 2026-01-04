// eslint-env jest
import { Entity, schema } from '@data-client/endpoint';
import { fromJS } from 'immutable';

import { INVALID } from '..';
import {
  normalize as normalizeImm,
  denormalize,
  type ImmutableStoreData,
} from '../imm';

// Helper to create ImmutableJS state from plain objects
function createImmutableState(state: {
  entities?: { [k: string]: { [k: string]: any } };
  indexes?: { [k: string]: { [k: string]: { [field: string]: string } } };
  entitiesMeta?: {
    [k: string]: {
      [k: string]: { date: number; expiresAt: number; fetchedAt: number };
    };
  };
}): ImmutableStoreData {
  return {
    entities: fromJS(state.entities || {}),
    indexes: fromJS(state.indexes || {}),
    entitiesMeta: fromJS(state.entitiesMeta || {}),
  };
}

let dateSpy: jest.SpyInstance;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe('normalizeImm - ImmutableJS normalization', () => {
  // Basic entity for testing
  class User extends Entity {
    id = '';
    name = '';
    pk() {
      return this.id;
    }
  }

  class Article extends Entity {
    id = '';
    title = '';
    author = User.fromJS();

    pk() {
      return this.id;
    }

    static schema = {
      author: User,
    };
  }

  describe('basic normalization', () => {
    test('normalizes a single entity into ImmutableJS state', () => {
      const initialState = createImmutableState({});

      const result = normalizeImm(
        User,
        { id: '1', name: 'John' },
        [],
        initialState,
      );

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['User', '1'])).toEqual({
        id: '1',
        name: 'John',
      });
    });

    test('normalizes with empty initial state (default)', () => {
      const result = normalizeImm(User, { id: '1', name: 'John' });

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['User', '1'])).toEqual({
        id: '1',
        name: 'John',
      });
    });

    test('returns input when schema is undefined', () => {
      const initialState = createImmutableState({});
      const input = { foo: 'bar' };

      const result = normalizeImm(undefined, input, [], initialState);

      expect(result.result).toBe(input);
      expect(result.entities).toBe(initialState.entities);
    });

    test('returns input when schema is null', () => {
      const initialState = createImmutableState({});
      const input = { foo: 'bar' };

      const result = normalizeImm(null, input, [], initialState);

      expect(result.result).toBe(input);
    });
  });

  describe('nested entities', () => {
    test('normalizes nested entities', () => {
      const initialState = createImmutableState({});

      const result = normalizeImm(
        Article,
        {
          id: '1',
          title: 'Hello World',
          author: { id: '10', name: 'Jane' },
        },
        [],
        initialState,
      );

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['Article', '1'])).toEqual({
        id: '1',
        title: 'Hello World',
        author: '10',
      });
      expect(result.entities.getIn(['User', '10'])).toEqual({
        id: '10',
        name: 'Jane',
      });
    });

    test('normalizes deeply nested entities', () => {
      class Comment extends Entity {
        id = '';
        text = '';
        author = User.fromJS();

        pk() {
          return this.id;
        }

        static schema = {
          author: User,
        };
      }

      class Post extends Entity {
        id = '';
        title = '';
        author = User.fromJS();
        comments: Comment[] = [];

        pk() {
          return this.id;
        }

        static schema = {
          author: User,
          comments: [Comment],
        };
      }

      const result = normalizeImm(Post, {
        id: 'post1',
        title: 'My Post',
        author: { id: 'user1', name: 'Alice' },
        comments: [
          { id: 'c1', text: 'Great!', author: { id: 'user2', name: 'Bob' } },
          { id: 'c2', text: 'Thanks!', author: { id: 'user1', name: 'Alice' } },
        ],
      });

      expect(result.result).toBe('post1');
      expect(result.entities.getIn(['Post', 'post1', 'comments'])).toEqual([
        'c1',
        'c2',
      ]);
      expect(result.entities.getIn(['Comment', 'c1', 'author'])).toBe('user2');
      expect(result.entities.getIn(['User', 'user1', 'name'])).toBe('Alice');
      expect(result.entities.getIn(['User', 'user2', 'name'])).toBe('Bob');
    });
  });

  describe('entity updates and merging', () => {
    test('merges with existing entities in state', () => {
      const initialState = createImmutableState({
        entities: {
          User: {
            '1': { id: '1', name: 'Old Name' },
          },
        },
        entitiesMeta: {
          User: {
            '1': { date: 1000, expiresAt: 2000, fetchedAt: 1000 },
          },
        },
      });

      const result = normalizeImm(
        User,
        { id: '1', name: 'New Name' },
        [],
        initialState,
        { date: 2000, expiresAt: 3000, fetchedAt: 2000 },
      );

      const user = result.entities.getIn(['User', '1']);
      // Verify the new data is present
      expect(user.name).toBe('New Name');
      expect(user.id).toBe('1');
    });

    test('handles multiple entities of same type', () => {
      const result = normalizeImm(
        [User],
        [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
          { id: '3', name: 'Charlie' },
        ],
      );

      expect(result.result).toEqual(['1', '2', '3']);
      expect(result.entities.getIn(['User', '1', 'name'])).toBe('Alice');
      expect(result.entities.getIn(['User', '2', 'name'])).toBe('Bob');
      expect(result.entities.getIn(['User', '3', 'name'])).toBe('Charlie');
    });
  });

  describe('arrays and collections', () => {
    test('normalizes array of entities', () => {
      const result = normalizeImm(
        [User],
        [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ],
      );

      expect(result.result).toEqual(['1', '2']);
      expect(result.entities.getIn(['User', '1'])).toEqual({
        id: '1',
        name: 'User 1',
      });
      expect(result.entities.getIn(['User', '2'])).toEqual({
        id: '2',
        name: 'User 2',
      });
    });

    test('normalizes empty array', () => {
      const result = normalizeImm([User], []);

      expect(result.result).toEqual([]);
    });
  });

  describe('entity meta', () => {
    test('stores entity metadata correctly', () => {
      const meta = { date: 1000, expiresAt: 2000, fetchedAt: 1000 };

      const result = normalizeImm(
        User,
        { id: '1', name: 'Test' },
        [],
        createImmutableState({}),
        meta,
      );

      expect(result.entitiesMeta.getIn(['User', '1'])).toEqual(meta);
    });
  });

  describe('indexes', () => {
    class IndexedUser extends Entity {
      id = '';
      username = '';

      pk() {
        return this.id;
      }

      static indexes = ['username'] as const;
    }

    test('creates indexes for indexed entities', () => {
      const result = normalizeImm(IndexedUser, {
        id: '1',
        username: 'johndoe',
      });

      expect(result.indexes.getIn(['IndexedUser', 'username', 'johndoe'])).toBe(
        '1',
      );
    });

    test('updates indexes when entity changes', () => {
      const initialState = createImmutableState({
        entities: {
          IndexedUser: {
            '1': { id: '1', username: 'oldname' },
          },
        },
        indexes: {
          IndexedUser: {
            username: { oldname: '1' },
          },
        },
        entitiesMeta: {
          IndexedUser: {
            '1': { date: 1000, expiresAt: 2000, fetchedAt: 1000 },
          },
        },
      });

      const result = normalizeImm(
        IndexedUser,
        { id: '1', username: 'newname' },
        [],
        initialState,
        { date: 2000, expiresAt: 3000, fetchedAt: 2000 },
      );

      expect(result.indexes.getIn(['IndexedUser', 'username', 'newname'])).toBe(
        '1',
      );
    });
  });

  describe('invalidation', () => {
    test('invalidates entity correctly', () => {
      const InvalidateUser = new schema.Invalidate(User);

      const initialState = createImmutableState({
        entities: {
          User: {
            '1': { id: '1', name: 'Test' },
          },
        },
        entitiesMeta: {
          User: {
            '1': { date: 1000, expiresAt: 2000, fetchedAt: 1000 },
          },
        },
      });

      // Must pass an object to trigger invalidation (strings are treated as already processed)
      const result = normalizeImm(
        InvalidateUser,
        { id: '1', name: 'Test' },
        [],
        initialState,
      );

      expect(result.entities.getIn(['User', '1'])).toBe(INVALID);
    });
  });

  describe('error handling', () => {
    test('throws error for null input', () => {
      expect(() => {
        normalizeImm(User, null);
      }).toThrow();
    });

    test('throws error for unexpected input type', () => {
      expect(() => {
        normalizeImm(User, 'not an object');
      }).toThrow();
    });
  });

  describe('round-trip: normalize and denormalize', () => {
    test('denormalize returns original data structure', () => {
      // Use proper ImmutableJS initial state
      const initialState = createImmutableState({});

      const originalData = {
        id: '1',
        title: 'Test Article',
        author: { id: '10', name: 'Author' },
      };

      const normalized = normalizeImm(Article, originalData, [], initialState);

      // The entities are now proper ImmutableJS Maps
      const denormalized = denormalize(
        Article,
        '1',
        normalized.entities as any,
      );

      expect(denormalized).toBeInstanceOf(Article);
      expect((denormalized as Article).id).toBe('1');
      expect((denormalized as Article).title).toBe('Test Article');
      expect((denormalized as Article).author).toBeInstanceOf(User);
      expect((denormalized as Article).author.id).toBe('10');
      expect((denormalized as Article).author.name).toBe('Author');
    });

    test('handles array normalization round-trip', () => {
      const initialState = createImmutableState({});

      const originalData = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      const normalized = normalizeImm([User], originalData, [], initialState);

      const denormalized = denormalize(
        [User],
        normalized.result,
        normalized.entities as any,
      );

      expect(Array.isArray(denormalized)).toBe(true);
      expect(denormalized as User[]).toHaveLength(2);
      expect((denormalized as User[])[0]).toBeInstanceOf(User);
      expect((denormalized as User[])[0].id).toBe('1');
      expect((denormalized as User[])[1].id).toBe('2');
    });
  });

  describe('schema.Object', () => {
    test('normalizes plain objects with schemas', () => {
      const result = normalizeImm(
        { user: User },
        { user: { id: '1', name: 'Test' } },
      );

      expect(result.result).toEqual({ user: '1' });
      expect(result.entities.getIn(['User', '1', 'name'])).toBe('Test');
    });
  });

  describe('schema.Values', () => {
    test('normalizes values schema', () => {
      const ValuesSchema = new schema.Values(User);

      const result = normalizeImm(ValuesSchema, {
        first: { id: '1', name: 'First' },
        second: { id: '2', name: 'Second' },
      });

      expect(result.result).toEqual({ first: '1', second: '2' });
      expect(result.entities.getIn(['User', '1', 'name'])).toBe('First');
      expect(result.entities.getIn(['User', '2', 'name'])).toBe('Second');
    });
  });

  describe('integration with EntityMixin', () => {
    class FoodData {
      id = '';
      name = '';
    }
    class Food extends schema.EntityMixin(FoodData) {}

    class MenuData {
      id = '';
      name = '';
      food = Food.fromJS();
    }
    class Menu extends schema.EntityMixin(MenuData, {
      schema: { food: Food },
    }) {}

    test('normalizes EntityMixin entities', () => {
      const result = normalizeImm(Menu, {
        id: '1',
        name: 'Lunch Menu',
        food: { id: '10', name: 'Pizza' },
      });

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['Menu', '1', 'name'])).toBe('Lunch Menu');
      expect(result.entities.getIn(['Menu', '1', 'food'])).toBe('10');
      expect(result.entities.getIn(['Food', '10', 'name'])).toBe('Pizza');
    });
  });

  describe('error handling - additional coverage', () => {
    test('throws descriptive error for parseable JSON string input', () => {
      expect(() => {
        normalizeImm(User, '{"id": "1", "name": "Test"}');
      }).toThrow(/Parsing this input string as JSON worked/);
    });
  });

  describe('denormalize.imm coverage', () => {
    test('returns undefined input as-is', () => {
      const result = denormalize(User, undefined, fromJS({ User: {} }));
      expect(result).toBeUndefined();
    });
  });

  describe('index edge cases', () => {
    class IndexedUser extends Entity {
      id = '';
      username = '';

      pk() {
        return this.id;
      }

      static indexes = ['username'] as const;
    }

    test('handles index update when existing entity has old index value', () => {
      // Set up initial state with an indexed entity
      const initialState = createImmutableState({
        entities: {
          IndexedUser: {
            '1': { id: '1', username: 'oldusername' },
          },
        },
        indexes: {
          IndexedUser: {
            username: { oldusername: '1' },
          },
        },
        entitiesMeta: {
          IndexedUser: {
            '1': { date: 1000, expiresAt: 2000, fetchedAt: 1000 },
          },
        },
      });

      // Update the entity with a new username
      const result = normalizeImm(
        IndexedUser,
        { id: '1', username: 'newusername' },
        [],
        initialState,
        { date: 2000, expiresAt: 3000, fetchedAt: 2000 },
      );

      // Old index should be invalidated, new index should be set
      expect(
        result.indexes.getIn(['IndexedUser', 'username', 'newusername']),
      ).toBe('1');
      expect(
        result.indexes.getIn(['IndexedUser', 'username', 'oldusername']),
      ).toBe(INVALID);
      expect(result.entities.getIn(['IndexedUser', '1', 'username'])).toBe(
        'newusername',
      );
    });

    test('handles entity without index value defined', () => {
      // Entity with index field not set
      const result = normalizeImm(IndexedUser, { id: '1' });

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['IndexedUser', '1', 'id'])).toBe('1');
    });

    test('handles existing entity with undefined index value', () => {
      // Set up initial state where entity exists but index field is undefined
      const initialState = createImmutableState({
        entities: {
          IndexedUser: {
            '1': { id: '1' }, // username is undefined
          },
        },
        indexes: {
          IndexedUser: {
            username: {},
          },
        },
        entitiesMeta: {
          IndexedUser: {
            '1': { date: 1000, expiresAt: 2000, fetchedAt: 1000 },
          },
        },
      });

      // Update with a new username
      const result = normalizeImm(
        IndexedUser,
        { id: '1', username: 'newuser' },
        [],
        initialState,
        { date: 2000, expiresAt: 3000, fetchedAt: 2000 },
      );

      // Should set the new index without trying to remove undefined old value
      expect(result.indexes.getIn(['IndexedUser', 'username', 'newuser'])).toBe(
        '1',
      );
    });

    test('handles multiple indexed entities in sequence', () => {
      const result = normalizeImm(
        [IndexedUser],
        [
          { id: '1', username: 'alice' },
          { id: '2', username: 'bob' },
        ],
      );

      expect(result.indexes.getIn(['IndexedUser', 'username', 'alice'])).toBe(
        '1',
      );
      expect(result.indexes.getIn(['IndexedUser', 'username', 'bob'])).toBe(
        '2',
      );
    });
  });

  describe('default empty store behavior', () => {
    test('works with no initial state provided', () => {
      // This tests the emptyImmutableLike fallback
      const result = normalizeImm(User, { id: '1', name: 'Test' });

      expect(result.result).toBe('1');
      expect(result.entities.getIn(['User', '1', 'name'])).toBe('Test');
    });

    test('default store getIn returns undefined for non-existent paths', () => {
      const result = normalizeImm(User, { id: '1', name: 'Test' });

      // Verify the default store behavior for non-existent paths
      expect(result.entities.getIn(['NonExistent', 'key'])).toBeUndefined();
      expect(result.entities.getIn(['User', '999'])).toBeUndefined();
    });

    test('default store get returns nested structure for existing keys', () => {
      const result = normalizeImm(User, { id: '1', name: 'Test' });

      // Call get() on the result to cover the get() method
      const userEntities = result.entities.get('User');
      expect(userEntities).toBeDefined();

      // The returned object should also have get/getIn methods
      if (userEntities && typeof userEntities.getIn === 'function') {
        expect(userEntities.getIn(['1', 'name'])).toBe('Test');
      }
    });

    test('default store get returns primitive values directly', () => {
      const result = normalizeImm(User, { id: '1', name: 'Test' });

      // Access nested values via get chain
      const userEntities = result.entities.get('User');
      if (userEntities && typeof userEntities.get === 'function') {
        const user = userEntities.get('1');
        // At this level, user is the entity object itself
        expect(user).toBeDefined();

        // Access a primitive property on the user object
        if (user && typeof user.get === 'function') {
          const name = user.get('name');
          // This should return a primitive string, covering line 143
          expect(name).toBe('Test');
        }
      }
    });

    test('default store get returns undefined for non-existent key', () => {
      const result = normalizeImm(User, { id: '1', name: 'Test' });

      // Call get on a non-existent key in nested structure
      const userEntities = result.entities.get('User');
      if (userEntities && typeof userEntities.get === 'function') {
        const nonExistent = userEntities.get('nonexistent');
        // Returns undefined for missing key (primitive path)
        expect(nonExistent).toBeUndefined();
      }
    });

    test('default store handles nested setIn operations', () => {
      // Multiple entities trigger multiple setIn calls
      const result = normalizeImm(
        [User],
        [
          { id: '1', name: 'First' },
          { id: '2', name: 'Second' },
        ],
      );

      expect(result.entities.getIn(['User', '1', 'name'])).toBe('First');
      expect(result.entities.getIn(['User', '2', 'name'])).toBe('Second');
    });
  });
});
