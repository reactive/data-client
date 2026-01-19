// eslint-env jest
import { MemoCache, MemoPolicy as PojoPolicy } from '@data-client/normalizr';
import { MemoPolicy as ImmPolicy } from '@data-client/normalizr/imm';
import { useQuery, useSuspense, __INTERNAL__ } from '@data-client/react';
import { RestEndpoint } from '@data-client/rest';
import { IDEntity } from '__tests__/new';

import { fromJSState } from './denormalize';
import { schema, DenormalizeNullable, Query, All, Collection } from '../..';

const { initialState } = __INTERNAL__;

let dateSpy: jest.Spied<typeof global.Date.now>;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class User extends IDEntity {
  name = '';
  isAdmin = false;
}

describe.each([
  ['direct', <T>(data: T) => data, <T>(data: T) => data, PojoPolicy],
  [
    'immutable',
    fromJSState,
    (v: any) => (typeof v?.toJS === 'function' ? v.toJS() : v),
    ImmPolicy,
  ],
])(`input (%s)`, (_, createInput, createOutput, MyDelegate) => {
  const SCHEMA_CASES = [
    ['All', new schema.Object({ results: new All(User) })],
    ['Collection', new schema.Object({ results: new Collection([User]) })],
  ] as const;

  // TODO: once full immutable support is added, remove this
  describe.each(_ === 'immutable' ? SCHEMA_CASES.slice(0, 1) : SCHEMA_CASES)(
    `${Query.name} denormalization (%s schema)`,
    (_, usersSchema) => {
      const sortedUsers = new Query(
        usersSchema,
        ({ results }, { asc } = { asc: false }) => {
          if (!results) return results;
          const sorted = [...results].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          if (asc) return sorted;
          return sorted.reverse();
        },
      );

      test('denormalize sorts', () => {
        const state = createInput({
          ...initialState,
          entities: {
            User: {
              1: { id: '1', name: 'Milo' },
              2: { id: '2', name: 'Jake' },
              3: { id: '3', name: 'Zeta' },
              4: { id: '4', name: 'Alpha' },
            },
            [new Collection([User]).key]: {
              [new Collection([User]).pk(undefined, undefined, '', [])]: [
                1, 2, 3, 4,
              ],
            },
          },
        });
        const users: DenormalizeNullable<typeof sortedUsers> | symbol =
          new MemoCache(MyDelegate).query(sortedUsers, [], state).data;
        expect(users).not.toEqual(expect.any(Symbol));
        if (typeof users === 'symbol') return;
        expect(users?.[0]?.name).toBe('Zeta');
        expect(users).toMatchSnapshot();
      });

      test('denormalize sorts with arg', () => {
        const state = createInput({
          ...initialState,
          entities: {
            User: {
              1: { id: '1', name: 'Milo' },
              2: { id: '2', name: 'Jake' },
              3: { id: '3', name: 'Zeta' },
              4: { id: '4', name: 'Alpha' },
            },
            [new Collection([User]).key]: {
              [new Collection([User]).pk(undefined, undefined, '', [
                { asc: true },
              ])]: [1, 2, 3, 4],
            },
          },
        });
        expect(
          new MemoCache(MyDelegate).query(sortedUsers, [{ asc: true }], state)
            .data,
        ).toMatchSnapshot();
      });

      test('denormalizes should not be found when no entities are present', () => {
        const state = createInput({
          ...initialState,
          entities: {
            DOG: {
              1: { id: '1', name: 'Milo' },
              2: { id: '2', name: 'Jake' },
            },
          },
        });
        const { data } = new MemoCache(MyDelegate).query(
          sortedUsers,
          [],
          state,
        );

        expect(createOutput(data)).not.toEqual(expect.any(Array));
      });

      test('denormalize aggregates', () => {
        const userCountByAdmin = new Query(
          usersSchema,
          ({ results }, { isAdmin }: { isAdmin?: boolean } = {}) => {
            if (!results) return 0;
            if (isAdmin === undefined) return results.length;
            return results.filter(user => user.isAdmin === isAdmin).length;
          },
        );
        const state = createInput({
          ...initialState,
          entities: {
            User: {
              1: { id: '1', name: 'Milo' },
              2: { id: '2', name: 'Jake', isAdmin: true },
              3: { id: '3', name: 'Zeta' },
              4: { id: '4', name: 'Alpha' },
            },
            [new Collection([User]).key]: {
              [new Collection([User]).pk(undefined, undefined, '', [])]: [
                1, 2, 3, 4,
              ],
              [new Collection([User]).pk(undefined, undefined, '', [
                { isAdmin: false },
              ])]: [1, 3, 4],
              [new Collection([User]).pk(undefined, undefined, '', [
                { isAdmin: true },
              ])]: [2],
            },
          },
        });
        const totalCount:
          | DenormalizeNullable<typeof userCountByAdmin>
          | symbol = new MemoCache(MyDelegate).query(
          userCountByAdmin,
          [],
          state,
        ).data;

        expect(totalCount).toBe(4);
        const nonAdminCount:
          | DenormalizeNullable<typeof userCountByAdmin>
          | symbol = new MemoCache(MyDelegate).query(
          userCountByAdmin,
          [{ isAdmin: false }],
          state,
        ).data;
        expect(nonAdminCount).toBe(3);
        const adminCount:
          | DenormalizeNullable<typeof userCountByAdmin>
          | symbol = new MemoCache(MyDelegate).query(
          userCountByAdmin,
          [{ isAdmin: true }],
          state,
        ).data;
        expect(adminCount).toBe(1);
        if (typeof totalCount === 'symbol') return;

        // typecheck
        totalCount !== undefined && totalCount + 5;
        // @ts-expect-error
        totalCount?.bob;
      });
    },
  );
});

describe('top level schema', () => {
  const sortedUsers = new Query(
    new Collection([User]),
    (results, { asc } = { asc: false }, ...args) => {
      const sorted = [...results].sort((a, b) => a.name.localeCompare(b.name));
      if (asc) return sorted;
      return sorted.reverse();
    },
  );

  test('denormalize sorts', () => {
    const state = {
      ...initialState,
      entities: {
        User: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
          3: { id: '3', name: 'Zeta' },
          4: { id: '4', name: 'Alpha' },
        },
        [new Collection([User]).key]: {
          [new Collection([User]).pk({}, undefined, '', [])]: [1, 2, 3, 4],
        },
      },
    };
    const users = new MemoCache().query(sortedUsers, [], state).data;
    expect(users).not.toEqual(expect.any(Symbol));
    if (typeof users === 'symbol') return;
    expect(users && users[0].name).toBe('Zeta');
    expect(users).toMatchSnapshot();
  });

  test('works if base entity suspends', () => {
    const state = {
      ...initialState,
      entities: {
        User: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
          3: { id: '3', name: 'Zeta' },
          4: { id: '4', name: 'Alpha' },
        },
      },
    };
    const users = new MemoCache().query(sortedUsers, [], state).data;
    expect(users).toBeUndefined();
  });

  test('works if base entity suspends', () => {
    const allSortedUsers = new Query(
      new All(User),
      (results, { asc } = { asc: false }, ...args) => {
        const sorted = [...results].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        if (asc) return sorted;
        return sorted.reverse();
      },
    );
    const users = new MemoCache().query(allSortedUsers, [], initialState).data;
    expect(users).toEqual(expect.any(Symbol));
  });

  test('works with nested schemas', () => {
    const allSortedUsers = new Query(
      new All(User),
      (results, { asc } = { asc: false }, ...args) => {
        const sorted = [...results].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        if (asc) return sorted;
        return sorted.reverse();
      },
    );
    const users = new MemoCache().query(allSortedUsers, [], initialState).data;
    expect(users).toEqual(expect.any(Symbol));
  });

  test('denormalizes should not be found when no entities are present', () => {
    const state = {
      ...initialState,
      entities: {
        DOG: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      },
    };

    const value = new MemoCache().query(sortedUsers, [], state).data;

    expect(value).toEqual(undefined);
  });

  test('', () => {
    const getUsers = new RestEndpoint({
      path: '/users',
      searchParams: {} as { asc?: boolean },
      schema: sortedUsers,
    });
    () => {
      const users = useSuspense(getUsers, { asc: true });
      users.map(user => user.name);
      const others = useQuery(getUsers.schema, { asc: true });
      // @ts-expect-error
      others.map(user => user.name);
      others?.map(user => user.name);
    };
  });
});
