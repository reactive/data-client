// eslint-env jest
import { fromJS } from 'immutable';
import { IDEntity } from '__tests__/new';
import { inferResults, normalize } from '@rest-hooks/normalizr';

import denormalize from './denormalize';
import { schema, AbstractInstanceType } from '../..';
import { DELETED } from '../../special';

let dateSpy: jest.SpyInstance<number, []>;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
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
      normalize('abc', sch);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('should throw a custom error if data loads with json string unexpected value', () => {
    class User extends IDEntity {}
    const sch = new schema.All(User);
    function normalizeBad() {
      normalize('[{"id":5}]', sch);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  test('normalizes Objects using their values', () => {
    class User extends IDEntity {}
    const { result, entities } = normalize(
      { foo: { id: '1' }, bar: { id: '2' } },
      new schema.All(User),
    );
    expect(result).toBeUndefined();
    expect(entities).toMatchSnapshot();
  });

  describe('Class', () => {
    class Cats extends IDEntity {}
    test('normalizes a single entity', () => {
      const listSchema = new schema.All(Cats);
      expect(
        normalize([{ id: '1' }, { id: '2' }], listSchema).entities,
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

      const { result, entities } = normalize(
        [
          { type: 'Cat', id: '123' },
          { type: 'people', id: '123' },
          { id: '789', name: 'fido' },
          { type: 'Cat', id: '456' },
        ],
        listSchema,
      );
      expect(result).toBeUndefined();
      expect(entities).toMatchSnapshot();
      expect(inferSchemaFn.mock.calls).toMatchSnapshot();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      const users = new schema.All(User);
      expect(
        normalize({ foo: { id: '1' }, bar: { id: '2' } }, users).entities,
      ).toMatchSnapshot();
    });

    test('filters out undefined and null normalized values', () => {
      class User extends IDEntity {}
      const users = new schema.All(User);
      expect(
        normalize([undefined, { id: '123' }, null], users).entities,
      ).toMatchSnapshot();
    });
  });
});

describe.each([
  ['direct', <T>(data: T) => data, <T>(data: T) => data],
  [
    'immutable',
    fromJS,
    (v: any) => (typeof v?.toJS === 'function' ? v.toJS() : v),
  ],
])(
  `${schema.Array.name} denormalization (%s)`,
  (_, createInput, createOutput) => {
    test('denormalizes a single entity', () => {
      class Cat extends IDEntity {}
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      const sch = new schema.All(Cat);
      expect(
        denormalize(
          inferResults(sch, [], {}, entities),
          sch,
          createInput(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat) };
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      expect(
        denormalize(
          inferResults(catSchema, [], {}, entities),
          catSchema,
          createInput(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object with primitive', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat), nextPage: '' };
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      const input = inferResults(catSchema, [], {}, entities);
      let [value, found] = denormalize(input, catSchema, createInput(entities));
      expect(createOutput(value.results)).toMatchSnapshot();
      expect(found).toBe(true);
      [value, found] = denormalize(
        createInput(input),
        catSchema,
        createInput(entities),
      );
      expect(createOutput(value)).toMatchSnapshot();
      expect(found).toBe(true);
    });

    test('denormalizes removes undefined or DELETED entities', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat), nextPage: '' };
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
          3: undefined,
          4: DELETED,
        },
      };
      const input = inferResults(catSchema, [], {}, entities);
      let [value, found] = denormalize(input, catSchema, createInput(entities));
      expect(createOutput(value.results)).toMatchSnapshot();
      expect(found).toBe(true);
      [value, found] = denormalize(
        createInput(input),
        catSchema,
        createInput(entities),
      );
      expect(createOutput(value)).toMatchSnapshot();
      expect(found).toBe(true);
    });

    test('denormalizes should not be found when no entities are present', () => {
      class Cat extends IDEntity {}
      const catSchema = { results: new schema.All(Cat) };
      const entities = {
        DOG: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      const input = inferResults(catSchema, [], {}, entities);

      const [value, found] = denormalize(
        createInput(input),
        catSchema,
        createInput(entities),
      );
      expect(found).toBe(false);

      expect(createOutput(value)).toEqual({ results: undefined });
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

      const entities = {
        DOG: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      const input = inferResults(listSchema, [], {}, entities);
      const [value, found] = denormalize(
        createInput(input),
        listSchema,
        createInput(entities),
      );
      expect(found).toBe(false);

      expect(createOutput(value)).toEqual(undefined);
    });

    test('returns the input value if is null', () => {
      class Filling extends IDEntity {}
      class Taco extends IDEntity {
        static schema = { fillings: new schema.All(Filling) };
      }
      const entities = {
        Taco: {
          123: {
            id: '123',
            fillings: null,
          },
        },
      };
      expect(denormalize('123', Taco, createInput(entities))).toMatchSnapshot();
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

      const entities = {
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
      };

      const input = inferResults(listSchema, [], {}, entities);
      const [value, found, deleted] = denormalize(
        input,
        listSchema,
        createInput(entities),
      );
      expect(found).toBe(true);
      expect(deleted).toBe(false);
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
