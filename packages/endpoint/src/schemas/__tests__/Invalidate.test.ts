// eslint-env jest
import { Schema, normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { denormalizeSimple } from './denormalize';
import { schema } from '../..';
import { INVALID } from '../../special';
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

describe(`${schema.Invalidate.name} normalization`, () => {
  test('throws if not given an entity', () => {
    // @ts-expect-error
    expect(() => new schema.Invalidate()).toThrow();
  });

  test('normalizes an object', () => {
    class User extends IDEntity {}

    expect(
      normalize({ id: '1', type: 'users' }, new schema.Invalidate(User)),
    ).toMatchSnapshot();
  });

  test('normalizes already processed entities', () => {
    class MyEntity extends IDEntity {}
    expect(normalize('1', new schema.Invalidate(MyEntity))).toMatchSnapshot();
    expect(
      normalize(['1', '2'], new schema.Array(new schema.Invalidate(MyEntity))),
    ).toMatchSnapshot();
  });

  test('does not query', () => {
    class User extends IDEntity {}

    expect(
      new schema.Invalidate(User).queryKey(
        [{ id: 5 }],
        () => undefined,
        () => undefined,
        () => undefined,
      ),
    ).toBeUndefined();
  });

  it('should throw a custom error if data does not include pk', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }
    }
    function normalizeBad() {
      normalize({ secondthing: 'hi' }, new schema.Invalidate(MyEntity));
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should throw a custom error if data does not include pk (serializes pk)', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return `${this.name}`;
      }
    }
    function normalizeBad() {
      normalize({ secondthing: 'hi' }, new schema.Invalidate(MyEntity));
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });
});

describe(`${schema.Invalidate.name} denormalization`, () => {
  class User extends IDEntity {
    readonly username: string = '';
    readonly type: string = '';
  }
  const entities = {
    User: {
      '1': User.fromJS({ id: '1', username: 'Janey', type: 'users' }),
    },
  };

  test('denormalizes an object in the same manner as the Entity', () => {
    const user = denormalizeSimple('1', new schema.Invalidate(User), entities);
    expect(user).not.toEqual(expect.any(Symbol));
    if (typeof user === 'symbol') return;
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user?.username).toBe('Janey');
  });

  describe.each([
    ['direct', <T>(data: T) => data],
    ['immutable', fromJS],
  ])(`input (%s)`, (_, createInput) => {
    describe.each([
      [
        'class',
        <T extends Schema>(sch: T) => new schema.Array(sch),
        <T extends Record<string, any>>(sch: T) => new schema.Object(sch),
        denormalizeSimple,
      ],
      [
        'object, direct',
        <T extends Schema>(sch: T) => [sch],
        <T extends Record<string, any>>(sch: T) => sch,
        denormalizeSimple,
      ],
    ])(
      `schema construction (%s)`,
      (_, createArray, createObject, denormalize) => {
        test('denormalizes deleted entities as symbol', () => {
          const user = denormalize(
            '1',
            new schema.Invalidate(User),
            createInput({
              User: { '1': INVALID },
            }),
          );
          expect(user).toEqual(expect.any(Symbol));

          expect(
            denormalize(
              createInput({ data: '1' }),
              createObject({ data: new schema.Invalidate(User) }),
              createInput({
                User: { '1': INVALID },
              }),
            ),
          ).toEqual(expect.any(Symbol));
        });

        test('denormalize removes deleted entries in array', () => {
          expect(
            denormalize(
              createInput([{ data: '1' }]),
              createArray(createObject({ data: new schema.Invalidate(User) })),
              createInput({
                User: { '1': INVALID },
              }),
            ),
          ).toMatchSnapshot();
          expect(
            denormalize(
              createInput([{ data: '1' }]),
              createArray(createObject({ data: User })),
              createInput({
                User: { '1': INVALID },
              }),
            ),
          ).toMatchSnapshot();
        });

        test('denormalize sets undefined entities that are not present', () => {
          expect(
            denormalize(
              createInput([{ data: '1' }]),
              createArray(createObject({ data: new schema.Invalidate(User) })),
              createInput([{}]),
            ),
          ).toMatchSnapshot();

          expect(
            denormalize(
              createInput([{ data: '1' }]),
              createArray(createObject({ data: User })),
              createInput([{}]),
            ),
          ).toMatchSnapshot();

          expect(
            denormalize(
              createInput({ data: '1' }),
              createObject({ data: User }),
              createInput({}),
            ),
          ).toMatchSnapshot();
        });
      },
    );
  });
});
