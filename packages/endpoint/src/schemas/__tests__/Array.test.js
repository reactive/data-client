// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { denormalizeSimple, denormalizeLegacy } from './denormalize';
import { schema } from '../../';

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

test(`normalizes plain arrays as shorthand for ${schema.Array.name}`, () => {
  class User extends IDEntity {}
  expect(normalize([{ id: '1' }, { id: '2' }], [User])).toMatchSnapshot();
});

test('throws an error if created with more than one schema', () => {
  class User extends IDEntity {}
  class Cat extends IDEntity {}
  expect(() => normalize([{ id: '1' }], [Cat, User])).toThrow();
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
        normalize('abc', sch);
      }
      expect(normalizeBad).toThrowErrorMatchingSnapshot();
    });

    test('should throw a custom error if data loads with json string unexpected value', () => {
      class User extends IDEntity {}
      const sch = createSchema(User);
      function normalizeBad() {
        normalize('[{"id":5}]', sch);
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
        normalize(
          {
            id: '1',
            content: 'parent',
            children: [{ id: 4, content: 'child' }],
          },
          Parent,
        ),
      ).toMatchSnapshot();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      expect(
        normalize({ foo: { id: '1' }, bar: { id: '2' } }, createSchema(User)),
      ).toMatchSnapshot();
    });
  });

  describe('Class', () => {
    class Cats extends IDEntity {}
    test('normalizes a single entity', () => {
      const listSchema = createSchema(Cats);
      expect(
        normalize([{ id: '1' }, { id: '2' }], listSchema),
      ).toMatchSnapshot();
    });

    test('normalizes multiple entities', () => {
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
        normalize(
          [
            { type: 'Cat', id: '123' },
            { type: 'people', id: '123' },
            { id: '789', name: 'fido' },
            { type: 'Cat', id: '456' },
          ],
          listSchema,
        ),
      ).toMatchSnapshot();
      expect(inferSchemaFn.mock.calls).toMatchSnapshot();
    });

    test('normalizes Objects using their values', () => {
      class User extends IDEntity {}
      const users = createSchema(User);
      expect(
        normalize({ foo: { id: '1' }, bar: { id: '2' } }, users),
      ).toMatchSnapshot();
    });

    test('filters out undefined and null normalized values', () => {
      class User extends IDEntity {}
      const users = createSchema(User);
      expect(
        normalize([undefined, { id: '123' }, null], users),
      ).toMatchSnapshot();
    });
  });
});

describe.each([
  ['direct', data => data],
  ['immutable', fromJS],
])(`input (%s)`, (_, createInput) => {
  test('denormalizes plain arrays with nothing inside', () => {
    class User extends IDEntity {}
    const entities = {
      User: {
        1: { id: '1', name: 'Jane' },
      },
    };
    const sch = new schema.Object({ user: User, tacos: [] });
    expect(
      denormalizeSimple({ user: '1' }, sch, createInput(entities)),
    ).toMatchSnapshot();
    expect(
      denormalizeSimple(createInput({ user: '1' }), sch, createInput(entities)),
    ).toMatchSnapshot();

    expect(
      denormalizeSimple({ user: '1', tacos: [] }, sch, createInput(entities)),
    ).toMatchSnapshot();
    expect(
      denormalizeSimple(
        createInput({ user: '1', tacos: [] }),
        sch,
        createInput(entities),
      ),
    ).toMatchSnapshot();
  });

  describe.each([
    ['class', sch => new schema.Array(sch), denormalizeSimple],
    ['class, legacy', sch => new schema.Array(sch), denormalizeLegacy],
    ['object, direct', sch => [sch], denormalizeSimple],
  ])(
    `${schema.Array.name} denormalization (%s)`,
    (_, createSchema, denormalize) => {
      test('denormalizes a single entity', () => {
        class Cat extends IDEntity {}
        const entities = {
          Cat: {
            1: { id: '1', name: 'Milo' },
            2: { id: '2', name: 'Jake' },
          },
        };
        expect(
          denormalize(['1', '2'], createSchema(Cat), createInput(entities)),
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
            { a: '1', b: '2' },
            createSchema(Cat),
            createInput(entities),
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
          denormalize({ user: '1' }, sch, createInput(entities)),
        ).toMatchSnapshot();
        expect(
          denormalize(createInput({ user: '1' }), sch, createInput(entities)),
        ).toMatchSnapshot();

        expect(
          denormalize({ user: '1', tacos: [] }, sch, createInput(entities)),
        ).toMatchSnapshot();
        expect(
          denormalize(
            createInput({ user: '1', tacos: [] }),
            sch,
            createInput(entities),
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
            { results: ['1', '2'] },
            catSchema,
            createInput(entities),
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
          { results: ['1', '2'] },
          catSchema,
          createInput(entities),
        );
        expect(value).toMatchSnapshot();
        value = denormalize(
          createInput({ results: ['1', '2'] }),
          catSchema,
          createInput(entities),
        );
        expect(value).toMatchSnapshot();
      });

      test('denormalizes removes undefined', () => {
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
          createInput({ results: ['1', undefined, '2'] }),
          catSchema,
          createInput(entities),
        );
        expect(value).toMatchSnapshot();
        value = denormalize(
          { results: ['1', '2'] },
          catSchema,
          createInput(entities),
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
          createInput({ results: undefined }),
          catSchema,
          createInput(entities),
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
          createInput([{ data: '1' }, { data: '2' }, { data: '3' }]),
          createSchema(new schema.Object({ data: Cat })),
          createInput(entities),
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
          denormalize('123', Taco, createInput(entities)),
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
          createInput(input),
          listSchema,
          createInput(entities),
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
        const output = normalize(input, catList);
        expect(output).toMatchSnapshot();
        expect(denormalize(output.result, catList, output.entities)).toEqual(
          input,
        );
      });
    },
  );
});
