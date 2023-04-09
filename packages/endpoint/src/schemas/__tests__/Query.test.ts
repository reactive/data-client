// eslint-env jest
import { inferResults } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import denormalize from './denormalize';
import { schema, Query, Denormalize, DenormalizeNullable } from '../..';

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
    class User extends IDEntity {
      name = '';
      isAdmin = false;
    }
    const sortedUsers = new Query(
      new schema.Object({ results: new schema.All(User) }),
      ({ results }, { asc } = { asc: false }) => {
        const sorted = [...results].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        if (asc) return sorted;
        return sorted.reverse();
      },
    );

    test('denormalize sorts', () => {
      const entities = {
        User: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
          3: { id: '3', name: 'Zeta' },
          4: { id: '4', name: 'Alpha' },
        },
      };
      const users: DenormalizeNullable<typeof sortedUsers.schema> = denormalize(
        inferResults(sortedUsers.schema, [], {}, entities),
        sortedUsers.schema,
        createInput(entities),
      )[0];
      expect(users && users[0].name).toBe('Zeta');
      expect(users).toMatchSnapshot();
    });

    test('denormalize sorts with arg', () => {
      const entities = {
        User: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
          3: { id: '3', name: 'Zeta' },
          4: { id: '4', name: 'Alpha' },
        },
      };
      expect(
        denormalize(
          inferResults(sortedUsers.schema, [{ asc: true }], {}, entities),
          sortedUsers.schema,
          createInput(entities),
        ),
      ).toMatchSnapshot();
    });

    test('denormalizes should not be found when no entities are present', () => {
      const entities = {
        DOG: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake' },
        },
      };
      const input = inferResults(sortedUsers.schema, [], {}, entities);

      const [value] = denormalize(
        createInput(input),
        sortedUsers.schema,
        createInput(entities),
      );

      expect(createOutput(value)).toEqual(undefined);
    });

    test('denormalize aggregates', () => {
      const userCountByAdmin = new Query(
        new schema.Object({ results: new schema.All(User) }),
        ({ results }, { isAdmin }: { isAdmin?: boolean } = {}) => {
          if (isAdmin === undefined) return results.length;
          return results.filter(user => user.isAdmin === isAdmin).length;
        },
      );
      const entities = {
        User: {
          1: { id: '1', name: 'Milo' },
          2: { id: '2', name: 'Jake', isAdmin: true },
          3: { id: '3', name: 'Zeta' },
          4: { id: '4', name: 'Alpha' },
        },
      };
      const totalCount: DenormalizeNullable<typeof userCountByAdmin.schema> =
        denormalize(
          inferResults(userCountByAdmin.schema, [], {}, entities),
          userCountByAdmin.schema,
          createInput(entities),
        )[0];
      expect(totalCount).toBe(4);
      const nonAdminCount: DenormalizeNullable<typeof userCountByAdmin.schema> =
        denormalize(
          inferResults(
            userCountByAdmin.schema,
            [{ isAdmin: false }],
            {},
            entities,
          ),
          userCountByAdmin.schema,
          createInput(entities),
        )[0];
      expect(nonAdminCount).toBe(3);
      const adminCount: DenormalizeNullable<typeof userCountByAdmin.schema> =
        denormalize(
          inferResults(
            userCountByAdmin.schema,
            [{ isAdmin: true }],
            {},
            entities,
          ),
          userCountByAdmin.schema,
          createInput(entities),
        )[0];
      expect(adminCount).toBe(1);

      // typecheck
      totalCount !== undefined && totalCount + 5;
      // @ts-expect-error
      totalCount?.bob;
    });
  },
);
