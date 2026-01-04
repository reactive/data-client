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

  test('normalizes number input within array (already processed pk)', () => {
    class MyEntity extends IDEntity {}
    // Numbers work when inside arrays (bypasses entry-point type validation)
    expect(
      normalize(new schema.Array(new schema.Invalidate(MyEntity)), [1, 2, 3]),
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

  describe('with Union schema', () => {
    class User extends IDEntity {
      readonly type: string = 'users';
    }
    class Group extends IDEntity {
      readonly type: string = 'groups';
    }

    test('normalizes a union object with string schemaAttribute', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: User, groups: Group },
        'type',
      );

      expect(
        normalize(invalidateUnion, { id: '1', type: 'users' }),
      ).toMatchSnapshot();
      expect(
        normalize(invalidateUnion, { id: '2', type: 'groups' }),
      ).toMatchSnapshot();
    });

    test('normalizes a union object with function schemaAttribute', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: User, groups: Group },
        (input: any) => input.type,
      );

      expect(
        normalize(invalidateUnion, { id: '1', type: 'users' }),
      ).toMatchSnapshot();
      expect(
        normalize(invalidateUnion, { id: '2', type: 'groups' }),
      ).toMatchSnapshot();
    });

    test('normalizes array of Invalidate unions', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: User, groups: Group },
        'type',
      );

      expect(
        normalize(new schema.Array(invalidateUnion), [
          { id: '1', type: 'users' },
          { id: '2', type: 'groups' },
        ]),
      ).toMatchSnapshot();
    });

    test('returns input when schema attribute does not match', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: User, groups: Group },
        'type',
      );

      // 'unknown' type doesn't match any schema - returns input unchanged
      const result = normalize(invalidateUnion, {
        id: '1',
        type: 'unknown',
      });
      expect(result.result).toEqual({ id: '1', type: 'unknown' });
      expect(result.entities).toEqual({});
    });
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

  describe('with Union schema', () => {
    class UserDenorm extends IDEntity {
      readonly username: string = '';
      readonly type: string = 'users';
    }
    class GroupDenorm extends IDEntity {
      readonly groupname: string = '';
      readonly type: string = 'groups';
    }

    const unionEntities = {
      UserDenorm: {
        '1': UserDenorm.fromJS({ id: '1', username: 'Alice', type: 'users' }),
        '3': UserDenorm.fromJS({ id: '3', username: 'Charlie', type: 'users' }),
      },
      GroupDenorm: {
        '2': GroupDenorm.fromJS({
          id: '2',
          groupname: 'Admins',
          type: 'groups',
        }),
      },
    };

    test('denormalizes a union entity', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: UserDenorm, groups: GroupDenorm },
        'type',
      );
      const user = new SimpleMemoCache(POJOPolicy).denormalize(
        invalidateUnion,
        { id: '1', schema: 'users' },
        unionEntities,
      );
      expect(user).not.toEqual(expect.any(Symbol));
      if (typeof user === 'symbol') return;
      expect(user).toBeInstanceOf(UserDenorm);
      expect((user as any).username).toBe('Alice');

      const group = new SimpleMemoCache(POJOPolicy).denormalize(
        invalidateUnion,
        { id: '2', schema: 'groups' },
        unionEntities,
      );
      expect(group).not.toEqual(expect.any(Symbol));
      if (typeof group === 'symbol') return;
      expect(group).toBeInstanceOf(GroupDenorm);
      expect((group as any).groupname).toBe('Admins');
    });

    test('denormalizes invalidated union entity as symbol', () => {
      const invalidateUnion = new schema.Invalidate(
        { users: UserDenorm, groups: GroupDenorm },
        'type',
      );
      const user = new SimpleMemoCache(POJOPolicy).denormalize(
        invalidateUnion,
        { id: '1', schema: 'users' },
        {
          UserDenorm: { '1': INVALID },
          GroupDenorm: {},
        },
      );
      expect(user).toEqual(expect.any(Symbol));
    });
  });
});
