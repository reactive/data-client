// eslint-env jest
import { initialState, State, Controller } from '@data-client/core';
import {
  normalize,
  MemoCache,
  denormalize as plainDenormalize,
  INVALID,
  MemoPolicy as PojoDelegate,
} from '@data-client/normalizr';
import {
  MemoPolicy as ImmDelegate,
  denormalize as immDenormalize,
} from '@data-client/normalizr/imm';
import { IDEntity } from '__tests__/new';

import { schema } from '../..';
import { fromJSState } from './denormalize';

let dateSpy: jest.SpyInstance<number, []>;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe.each([[]])(`${schema.All.name} normalization (%s)`, () => {
  test('should throw a custom error if data loads with string unexpected value', () => {
    class User extends IDEntity {}
    const sch = new schema.All(User);
    function normalizeBad() {
      normalize(sch, 'abc');
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with json string unexpected value', () => {
    class User extends IDEntity {}
    const sch = new schema.All(User);
    function normalizeBad() {
      normalize(sch, '[{"id":5}]');
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('normalizes Objects using their values', () => {
    class User extends IDEntity {}
    const { result, entities } = normalize(new schema.All(User), {
      foo: { id: '1' },
      bar: { id: '2' },
    });
    expect(result).toBeUndefined();
    expect(entities).toMatchSnapshot();
  });

  describe('Class', () => {
    class Cats extends IDEntity {}
    test('normalizes a single entity', () => {
      const listSchema = new schema.All(Cats);
      expect(
        normalize(listSchema, [{ id: '1' }, { id: '2' }]).entities,
      ).toMatchSnapshot();
    });

    test('normalizes multiple entities', () => {
      const inferSchemaFn = jest.fn(input => input.type || 'dogs');
      class Person extends IDEntity {}
      const listSchema = new schema.All(
        {
          Cat: Cats,
          people: Person,
        },
        inferSchemaFn,
      );

      const { result, entities } = normalize(listSchema, [
        { type: 'Cat', id: '123' },
        { type: 'people', id: '123' },
        { id: '789', name: 'fido' },
        { type: 'Cat', id: '456' },
      ]);
      expect(result).toBeUndefined();
      expect(entities).toMatchSnapshot();
      expect(inferSchemaFn.mock.calls).toMatchSnapshot();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      const users = new schema.All(User);
      expect(
        normalize(users, { foo: { id: '1' }, bar: { id: '2' } }).entities,
      ).toMatchSnapshot();
    });

    test('filters out undefined and null normalized values', () => {
      class User extends IDEntity {}
      const users = new schema.All(User);
      expect(
        normalize(users, [undefined, { id: '123' }, null]).entities,
      ).toMatchSnapshot();
    });
  });
});

describe.each([
  [
    'direct',
    <T>(data: T) => data,
    <T>(data: T) => data,
    PojoDelegate,
    plainDenormalize,
  ],
  [
    'immutable',
    fromJSState,
    (v: any) => (typeof v?.toJS === 'function' ? v.toJS() : v),
    ImmDelegate,
    immDenormalize,
  ],
])(
  `${schema.Array.name} denormalization (%s)`,
  (_, createInput, createOutput, MyDelegate, denormalize) => {
    test('denormalizes a single entity', () => {
      class Cat extends IDEntity {}
      const state: State<unknown> = createInput({
        ...initialState,
        entities: {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      }) as any;
      const sch = new schema.All(Cat);
      expect(
        new Controller({ memo: new MemoCache(MyDelegate) }).get(sch, state),
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat) };
      const state = createInput({
        entities: {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      });
      // use memocache because we don't support 'object' schemas in controller yet
      expect(
        new MemoCache(MyDelegate).query(catSchema, [], state).data,
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object with primitive', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat), nextPage: '' };
      const state = createInput({
        entities: {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      });
      const value = new MemoCache(MyDelegate).query(catSchema, [], state).data;
      expect(value).not.toEqual(expect.any(Symbol));
      if (typeof value === 'symbol' || value === undefined) return;
      expect(createOutput(value.results)).toMatchSnapshot();
      expect(createOutput(value)).toMatchSnapshot();
    });

    test('denormalizes removes undefined or INVALID entities', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat), nextPage: '' };
      const state = createInput({
        entities: {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
            3: undefined,
            4: INVALID,
          },
        },
        indexes: {},
      });
      const value = new MemoCache(MyDelegate).query(catSchema, [], state).data;
      expect(value).not.toEqual(expect.any(Symbol));
      if (typeof value === 'symbol' || value === undefined) return;
      expect(createOutput(value.results).length).toBe(2);
      expect(createOutput(value.results)).toMatchSnapshot();
      expect(createOutput(value)).toMatchSnapshot();
    });

    test('denormalize maintains referential equality until entities are added', () => {
      class Cat extends IDEntity {}
      (Cat as any).defaults;
      const catSchema = { results: new schema.All(Cat), nextPage: '' };
      let state: State<unknown> = {
        ...initialState,
        entities: {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      };
      const memo = new MemoCache();
      const value = memo.query(catSchema, [], state).data;

      expect(createOutput(value).results?.length).toBe(2);
      expect(createOutput(value).results).toMatchSnapshot();
      const value2 = memo.query(catSchema, [], state).data;
      expect(createOutput(value).results[0]).toBe(
        createOutput(value2).results[0],
      );
      expect(value).toBe(value2);

      state = {
        ...state,
        entities: {
          ...state.entities,
          Cat: {
            ...state.entities.Cat,
            3: { id: '3', name: 'Jelico' },
          },
        },
      };
      const value3 = memo.query(catSchema, [], state).data;
      expect(createOutput(value3).results?.length).toBe(3);
      expect(createOutput(value3).results).toMatchSnapshot();
      expect(createOutput(value).results[0]).toBe(
        createOutput(value3).results[0],
      );
      expect(createOutput(value).results[2]).not.toBe(
        createOutput(value3).results[2],
      );
      expect(value).not.toBe(value3);
    });

    test('denormalizes should be invalid when no entities are present', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat) };
      const state = createInput({
        entities: {
          DOG: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      });
      const value = new MemoCache(MyDelegate).query(catSchema, [], state).data;
      expect(createOutput(value)).toEqual(expect.any(Symbol));
    });

    test('denormalizes should not be found when no entities are present (polymorphic)', () => {
      class Cat extends IDEntity {
        readonly type = 'Cat';
      }
      class Dog extends IDEntity {
        readonly type = 'dogs';
      }
      class Person extends IDEntity {
        readonly type = 'people';
      }
      const listSchema = new schema.All(
        {
          Cat: Cat,
          dogs: Dog,
          people: Person,
        },
        input => input.type || 'dogs',
      );

      const state = createInput({
        entities: {
          DOG: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        },
        indexes: {},
      });
      const value = new MemoCache(MyDelegate).query(listSchema, [], state).data;
      expect(createOutput(value)).toEqual(expect.any(Symbol));
    });

    test('returns the input value if is null', () => {
      class Filling extends IDEntity {}
      class Taco extends IDEntity {
        static schema = { fillings: new schema.All(Filling) };
      }
      const state = createInput({
        ...initialState,
        entities: {
          Taco: {
            123: {
              id: '123',
              fillings: null,
            },
          },
        },
      });
      expect(denormalize(Taco, '123', state.entities)).toMatchSnapshot();
    });

    test('denormalizes multiple entities', () => {
      class Cat extends IDEntity {
        readonly type = 'Cat';
      }
      class Dog extends IDEntity {
        readonly type = 'dogs';
      }
      class Person extends IDEntity {
        readonly type = 'people';
      }
      const listSchema = new schema.All(
        {
          Cat: Cat,
          dogs: Dog,
          people: Person,
        },
        input => input.type || 'dogs',
      );

      const state = createInput({
        entities: {
          Cat: {
            123: {
              id: '123',
              type: 'Cat',
            },
            456: {
              id: '456',
              type: 'Cat',
            },
          },
          Person: {
            123: {
              id: '123',
              type: 'people',
            },
          },
        },
        indexes: {},
      });
      const value = new MemoCache(MyDelegate).query(listSchema, [], state).data;
      expect(value).not.toEqual(expect.any(Symbol));
      if (typeof value === 'symbol') return;
      expect(value).toMatchSnapshot();
      const first = value && value[0];
      // type check to ensure correct inference
      first?.type;
    });

    test('does not allow initializing with non-entities', () => {
      class Cat extends IDEntity {}
      const catRecord = new schema.Object({
        cat: Cat,
      });
      // @ts-expect-error
      const catList = new schema.All(catRecord);
    });
  },
);
