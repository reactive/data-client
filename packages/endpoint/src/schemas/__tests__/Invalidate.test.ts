// eslint-env jest
import {
  INVALID,
  Schema,
  normalize,
  MemoPolicy as POJOPolicy,
} from '@data-client/normalizr';
import { MemoPolicy as ImmPolicy } from '@data-client/normalizr/imm';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import SimpleMemoCache, { fromJSEntities } from './denormalize';
import { schema } from '../..';
import Entity from '../Entity';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest
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
      normalize(new schema.Invalidate(User), { id: '1', type: 'users' }),
    ).toMatchSnapshot();
  });

  test('normalizes already processed entities', () => {
    class MyEntity extends IDEntity {}
    expect(normalize(new schema.Invalidate(MyEntity), '1')).toMatchSnapshot();
    expect(
      normalize(new schema.Array(new schema.Invalidate(MyEntity)), ['1', '2']),
    ).toMatchSnapshot();
  });

  test('does not query', () => {
    class User extends IDEntity {}

    expect(
      new schema.Invalidate(User).queryKey([{ id: 5 }], () => undefined, {
        getEntity: () => undefined,
        getIndex: () => undefined,
      }),
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
      normalize(new schema.Invalidate(MyEntity), { secondthing: 'hi' });
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
      normalize(new schema.Invalidate(MyEntity), { secondthing: 'hi' });
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
    const user = new SimpleMemoCache(POJOPolicy).denormalize(
      new schema.Invalidate(User),
      '1',
      entities,
    );
    expect(user).not.toEqual(expect.any(Symbol));
    if (typeof user === 'symbol') return;
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user?.username).toBe('Janey');
    // Immutable version
    const userImm = new SimpleMemoCache(ImmPolicy).denormalize(
      new schema.Invalidate(User),
      '1',
      fromJSEntities(entities),
    );
    expect(userImm).not.toEqual(expect.any(Symbol));
    if (typeof userImm === 'symbol') return;
    expect(userImm).toBeDefined();
    expect(userImm).toBeInstanceOf(User);
    expect(userImm?.username).toBe('Janey');
  });

  describe.each([
    ['direct', <T>(data: T) => data, <T>(data: T) => data, POJOPolicy],
    ['immutable', fromJS, fromJSEntities, ImmPolicy],
  ])(`input (%s)`, (_, createInput, createEntities, Delegate) => {
    describe.each([
      [
        'class',
        <T extends Schema>(sch: T) => new schema.Array(sch),
        <T extends Record<string, any>>(sch: T) => new schema.Object(sch),
        new SimpleMemoCache(Delegate).denormalize,
      ],
      [
        'object, direct',
        <T extends Schema>(sch: T) => [sch],
        <T extends Record<string, any>>(sch: T) => sch,
        new SimpleMemoCache(Delegate).denormalize,
      ],
    ])(
      `schema construction (%s)`,
      (_, createArray, createObject, denormalize) => {
        test('denormalizes deleted entities as symbol', () => {
          const user = denormalize(
            new schema.Invalidate(User),
            '1',
            createInput({
              User: { '1': INVALID },
            }),
          );
          expect(user).toEqual(expect.any(Symbol));

          expect(
            denormalize(
              createObject({ data: new schema.Invalidate(User) }),
              createInput({ data: '1' }),
              createEntities({
                User: { '1': INVALID },
              }),
            ),
          ).toEqual(expect.any(Symbol));
        });

        test('denormalize removes deleted entries in array', () => {
          expect(
            denormalize(
              createArray(createObject({ data: new schema.Invalidate(User) })),
              createInput([{ data: '1' }]),
              createEntities({
                User: { '1': INVALID },
              }),
            ),
          ).toMatchSnapshot();
          expect(
            denormalize(
              createArray(createObject({ data: User })),
              createInput([{ data: '1' }]),
              createEntities({
                User: { '1': INVALID },
              }),
            ),
          ).toMatchSnapshot();
        });

        test('denormalize sets undefined entities that are not present', () => {
          expect(
            denormalize(
              createArray(createObject({ data: new schema.Invalidate(User) })),
              createInput([{ data: '1' }]),
              createEntities({}),
            ),
          ).toMatchSnapshot();

          expect(
            denormalize(
              createArray(createObject({ data: User })),
              createInput([{ data: '1' }]),
              createEntities({}),
            ),
          ).toMatchSnapshot();

          expect(
            denormalize(
              createObject({ data: User }),
              createInput({ data: '1' }),
              createEntities({}),
            ),
          ).toMatchSnapshot();
        });
      },
    );
  });
});
