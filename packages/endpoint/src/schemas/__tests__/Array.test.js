// eslint-env jest
import {
  normalize,
  denormalize as plainDenormalize,
} from '@data-client/normalizr';
import { denormalize as immDenormalize } from '@data-client/normalizr/imm';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { fromJSEntities } from './denormalize';
import { schema } from '../../';

let dateSpy;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

test(`normalizes plain arrays as shorthand for ${schema.Array.name}`, () => {
  class User extends IDEntity {}
  expect(normalize([User], [{ id: '1' }, { id: '2' }])).toMatchSnapshot();
});

test('throws an error if created with more than one schema', () => {
  class User extends IDEntity {}
  class Cat extends IDEntity {}
  expect(() => normalize([Cat, User], [{ id: '1' }])).toThrow();
});
describe.each([
  ['schema', sch => new schema.Array(sch)],
  ['plain', sch => [sch]],
])(`${schema.Array.name} normalization (%s)`, (_, createSchema) => {
  describe('Object', () => {
    test('should throw a custom error if data loads with string unexpected value', () => {
      class User extends IDEntity {}
      const sch = createSchema(User);
      function normalizeBad() {
        normalize(sch, 'abc');
      }
      expect(normalizeBad).toThrowErrorMatchingSnapshot();
    });

    test('should throw a custom error if data loads with json string unexpected value', () => {
      class User extends IDEntity {}
      const sch = createSchema(User);
      function normalizeBad() {
        normalize(sch, '[{"id":5}]');
      }
      expect(normalizeBad).toThrowErrorMatchingSnapshot();
    });

    test('passes its parent to its children when normalizing', () => {
      class Child extends IDEntity {
        content = '';

        static fromJS(entity, parent, key) {
          return super.fromJS({
            ...entity,
            parentId: parent.id,
            parentKey: key,
          });
        }
      }
      class Parent extends IDEntity {
        content = '';
        children = [];

        static schema = {
          children: createSchema(Child),
        };
      }

      expect(
        normalize(Parent, {
          id: '1',
          content: 'parent',
          children: [{ id: 4, content: 'child' }],
        }),
      ).toMatchSnapshot();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      expect(
        normalize(createSchema(User), { foo: { id: '1' }, bar: { id: '2' } }),
      ).toMatchSnapshot();
    });
  });

  describe('Class', () => {
    class Cats extends IDEntity {}
    class Dogs extends IDEntity {}
    test('normalizes a single entity', () => {
      const listSchema = createSchema(Cats);
      expect(
        normalize(listSchema, [{ id: '1' }, { id: '2' }]),
      ).toMatchSnapshot();
    });

    test('normalizes multiple entities', () => {
      const inferSchemaFn = jest.fn(input => input.type || 'dogs');
      class Person extends IDEntity {}
      const listSchema = new schema.Array(
        {
          Cat: Cats,
          people: Person,
          dogs: Dogs,
        },
        inferSchemaFn,
      );

      expect(
        normalize(listSchema, [
          { type: 'Cat', id: '123' },
          { type: 'people', id: '123' },
          { id: '789', name: 'fido' },
          { type: 'Cat', id: '456' },
        ]),
      ).toMatchSnapshot();
      expect(inferSchemaFn.mock.calls).toMatchSnapshot();
    });

    test('normalizes multiple entities warning when type is not found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const inferSchemaFn = jest.fn(input => input.type || 'dogs');
      class Person extends IDEntity {}
      const listSchema = new schema.Array(
        {
          Cat: Cats,
          people: Person,
        },
        inferSchemaFn,
      );

      expect(
        normalize(listSchema, [
          { type: 'Cat', id: '123' },
          { type: 'people', id: '123' },
          { type: 'not found', id: '789' },
          { type: 'Cat', id: '456' },
        ]),
      ).toMatchSnapshot();
      expect(inferSchemaFn.mock.calls).toMatchSnapshot();
      expect(warnSpy.mock.calls).toMatchSnapshot();
      warnSpy.mockRestore();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      const users = createSchema(User);
      expect(
        normalize(users, { foo: { id: '1' }, bar: { id: '2' } }),
      ).toMatchSnapshot();
    });

    test('does not filter out undefined and null normalized values', () => {
      class User extends IDEntity {}
      const users = createSchema(User);
      expect(
        normalize(users, [undefined, { id: '123' }, null]),
      ).toMatchSnapshot();
    });
  });
});

describe.each([
  ['direct', data => data, data => data, plainDenormalize],
  ['immutable', fromJS, fromJSEntities, immDenormalize],
])(`input (%s)`, (_, createInput, createEntities, denormalize) => {
  test('denormalizes plain arrays with nothing inside', () => {
    class User extends IDEntity {}
    const entities = {
      User: {
        1: { id: '1', name: 'Jane' },
      },
    };
    const sch = new schema.Object({ user: User, tacos: [] });
    expect(
      denormalize(sch, { user: '1' }, createEntities(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(sch, createInput({ user: '1' }), createEntities(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(sch, { user: '1', tacos: [] }, createEntities(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(
        sch,
        createInput({ user: '1', tacos: [] }),
        createEntities(entities),
      ),
    ).toMatchSnapshot();
  });

  describe.each([
    ['class', sch => new schema.Array(sch)],
    ['object, direct', sch => [sch]],
  ])(`${schema.Array.name} denormalization (%s)`, (_, createSchema) => {
    test('denormalizes a single entity', () => {
      class Cat extends IDEntity {}
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      expect(
        denormalize(createSchema(Cat), ['1', '2'], createEntities(entities)),
      ).toMatchSnapshot();
    });

    test('denormalizes non-array as identity', () => {
      class Cat extends IDEntity {}
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      expect(
        denormalize(
          createSchema(Cat),
          { a: '1', b: '2' },
          createEntities(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes plain arrays with plain object inside', () => {
      class User extends IDEntity {}
      const entities = {
        User: {
          1: { id: '1', name: 'Jane' },
        },
      };
      const sch = new schema.Object({
        user: User,
        tacos: createSchema({ next: '' }),
      });
      expect(
        denormalize(sch, { user: '1' }, createEntities(entities)),
      ).toMatchSnapshot();
      expect(
        denormalize(sch, createInput({ user: '1' }), createEntities(entities)),
      ).toMatchSnapshot();

      expect(
        denormalize(sch, { user: '1', tacos: [] }, createEntities(entities)),
      ).toMatchSnapshot();
      expect(
        denormalize(
          sch,
          createInput({ user: '1', tacos: [] }),
          createEntities(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object', () => {
      class Cat extends IDEntity {}
      const catSchema = new schema.Object({ results: createSchema(Cat) });
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      expect(
        denormalize(
          catSchema,
          { results: ['1', '2'] },
          createEntities(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes nested in object with primitive', () => {
      class Cat extends IDEntity {}
      const catSchema = new schema.Object({
        results: createSchema(Cat),
        nextPage: '',
      });
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      let value = denormalize(
        catSchema,
        { results: ['1', '2'] },
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
      value = denormalize(
        catSchema,
        createInput({ results: ['1', '2'] }),
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
    });

    test('denormalizes removes undefined but not null', () => {
      class Cat extends IDEntity {}
      const catSchema = new schema.Object({
        results: createSchema(Cat),
        nextPage: '',
      });
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      let value = denormalize(
        catSchema,
        createInput({ results: ['1', undefined, '2', null] }),
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
      value = denormalize(
        catSchema,
        { results: ['1', '2'] },
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
    });

    test('denormalizes should not be found when result array is undefined', () => {
      class Cat extends IDEntity {}
      const catSchema = new schema.Object({ results: createSchema(Cat) });
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      let value = denormalize(
        catSchema,
        createInput({ results: undefined }),
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
    });

    test('denormalizes with missing entity should have true second value', () => {
      class Cat extends IDEntity {}
      const entities = {
        Cat: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      let value = denormalize(
        createSchema(new schema.Object({ data: Cat })),
        createInput([{ data: '1' }, { data: '2' }, { data: '3' }]),
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
    });

    test('returns the input value if is not an array', () => {
      class Filling extends IDEntity {}
      class Taco extends IDEntity {
        static schema = { fillings: createSchema(Filling) };
      }
      const entities = {
        Taco: {
          123: {
            id: '123',
            fillings: null,
          },
        },
      };

      expect(
        denormalize(Taco, '123', createEntities(entities)),
      ).toMatchSnapshot();
    });

    test('denormalizes multiple entities', () => {
      class Cat extends IDEntity {
        type = 'Cat';
      }
      class Person extends IDEntity {
        type = 'people';
      }
      const listSchema = new schema.Array(
        {
          Cat: Cat,
          dogs: new schema.Object({}),
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

      const input = [
        { id: '123', schema: 'Cat' },
        { id: '123', schema: 'people' },
        { id: { id: '789' }, schema: 'dogs' },
        { id: '456', schema: 'Cat' },
      ];

      const value = denormalize(
        listSchema,
        createInput(input),
        createEntities(entities),
      );
      expect(value).toMatchSnapshot();
    });

    test('does not assume mapping of schema to attribute values when schemaAttribute is not set', () => {
      class Cat extends IDEntity {}
      const catRecord = new schema.Object({
        cat: Cat,
      });
      const catList = new schema.Array(catRecord);
      const input = [
        { cat: { id: '1' }, id: '5' },
        { cat: { id: '2' }, id: '6' },
      ];
      const output = normalize(catList, input);
      expect(output).toMatchSnapshot();
      expect(
        denormalize(catList, output.result, createEntities(output.entities)),
      ).toEqual(input);
    });
  });
});

describe('nested polymorphic schemas', () => {
  class User extends IDEntity {
    type = 'users';
  }
  class Group extends IDEntity {
    type = 'groups';
  }

  test('Array of Array normalizes without hoisting', () => {
    const innerArray = new schema.Array(User);
    const outerArray = new schema.Array(innerArray);

    const input = [[{ id: '1' }, { id: '2' }], [{ id: '3' }]];
    const output = normalize(outerArray, input);

    expect(output.entities.User).toEqual({
      1: expect.objectContaining({ id: '1' }),
      2: expect.objectContaining({ id: '2' }),
      3: expect.objectContaining({ id: '3' }),
    });
    expect(output.result).toEqual([['1', '2'], ['3']]);
  });

  test('Array of Union normalizes with hoisting', () => {
    const union = new schema.Union({ users: User, groups: Group }, 'type');
    const arrayOfUnion = new schema.Array(union);

    const input = [
      { id: '1', type: 'users' },
      { id: '2', type: 'groups' },
    ];
    const output = normalize(arrayOfUnion, input);

    expect(output.entities.User['1']).toBeDefined();
    expect(output.entities.Group['2']).toBeDefined();
    expect(output.result).toEqual([
      { id: '1', schema: 'users' },
      { id: '2', schema: 'groups' },
    ]);
  });

  test('Array of Invalidate normalizes without hoisting (calls invalidate)', () => {
    const invalidate = new schema.Invalidate(User);
    const arrayOfInvalidate = new schema.Array(invalidate);

    const input = [{ id: '1' }, { id: '2' }];
    const output = normalize(arrayOfInvalidate, input);

    // Invalidate should mark entities as INVALID, not store them as objects
    expect(output.entities.User['1']).toEqual(expect.any(Symbol));
    expect(output.entities.User['2']).toEqual(expect.any(Symbol));
    expect(output.result).toEqual(['1', '2']);
  });
});
