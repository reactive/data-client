// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { denormalize as plainDenormalize } from '@data-client/normalizr';
import { denormalize as immDenormalize } from '@data-client/normalizr/imm';
import { IDEntity } from '__tests__/new';
import { waterfallSchema } from '__tests__/UnionSchema';
import { fromJS } from 'immutable';

import { SimpleMemoCache, fromJSEntities } from './denormalize';
import { schema, Union } from '../../';

let dateSpy;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});
let warnSpy;
afterEach(() => {
  warnSpy.mockRestore();
});
beforeEach(() => {
  (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {});
});

describe(`${schema.Union.name} normalization`, () => {
  test('throws if not given a schemaAttribute', () => {
    expect(() => new Union({})).toThrow();
  });

  test('normalizes an object using string schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );

    expect(normalize(union, { id: '1', type: 'users' })).toMatchSnapshot();
    expect(normalize(union, { id: '2', type: 'groups' })).toMatchSnapshot();
  });

  test('normalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return (
          input.username ? 'users'
          : input.groupname ? 'groups'
          : null
        );
      },
    );

    expect(normalize(union, { id: '1', username: 'Janey' })).toMatchSnapshot();
    expect(
      normalize(union, { id: '2', groupname: 'People' }),
    ).toMatchSnapshot();
    expect(normalize(union, { id: '3', notdefined: 'yep' })).toMatchSnapshot();
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });
});

describe(`${schema.Union.name} buildQueryKey`, () => {
  class User extends IDEntity {
    static key = 'User';
  }
  class Group extends IDEntity {
    static key = 'Group';
  }

  // Common schema definitions
  const stringAttributeUnion = new Union(
    {
      users: User,
      groups: Group,
    },
    'type',
  );

  const functionAttributeUnion = new Union(
    {
      users: User,
      groups: Group,
    },
    input => {
      return (
        input.username ? 'users'
        : input.groupname ? 'groups'
        : undefined
      );
    },
  );

  test('buildQueryKey with discriminator in args', () => {
    const memo = new SimpleMemoCache();

    const state = {
      entities: {
        User: {
          1: { id: '1', username: 'Janey', type: 'users' },
        },
        Group: {
          2: { id: '2', groupname: 'People', type: 'groups' },
        },
      },
      indexes: {},
    };

    // Fast case - args include type discriminator
    const result1 = memo.memo.buildQueryKey(
      stringAttributeUnion,
      [{ id: '1', type: 'users' }],
      state,
    );
    expect(result1).toEqual({ id: '1', schema: 'users' });

    const result2 = memo.memo.buildQueryKey(
      stringAttributeUnion,
      [{ id: '2', type: 'groups' }],
      state,
    );
    expect(result2).toEqual({ id: '2', schema: 'groups' });
  });

  test('buildQueryKey without discriminator - fallback case', () => {
    const memo = new SimpleMemoCache();

    const state = {
      entities: {
        User: {
          1: { id: '1', username: 'Janey', type: 'users' },
        },
        Group: {
          2: { id: '2', groupname: 'People', type: 'groups' },
        },
      },
      indexes: {},
    };

    // Fallback case - args missing type discriminator, only {id}
    // Should try every possible schema until it finds a match
    const result1 = memo.memo.buildQueryKey(
      stringAttributeUnion,
      [{ id: '1' }],
      state,
    );
    expect(result1).toEqual({ id: '1', schema: 'users' });

    const result2 = memo.memo.buildQueryKey(
      stringAttributeUnion,
      [{ id: '2' }],
      state,
    );
    expect(result2).toEqual({ id: '2', schema: 'groups' });
  });

  test('buildQueryKey with function schemaAttribute missing discriminator', () => {
    const memo = new SimpleMemoCache();

    const state = {
      entities: {
        User: {
          1: { id: '1', username: 'Janey' },
        },
        Group: {
          2: { id: '2', groupname: 'People' },
        },
      },
      indexes: {},
    };

    // With function schemaAttribute, args missing username/groupname
    // Should fallback to trying every schema
    const result1 = memo.memo.buildQueryKey(
      functionAttributeUnion,
      [{ id: '1' }],
      state,
    );
    expect(result1).toEqual({ id: '1', schema: 'users' });

    const result2 = memo.memo.buildQueryKey(
      functionAttributeUnion,
      [{ id: '2' }],
      state,
    );
    expect(result2).toEqual({ id: '2', schema: 'groups' });
  });

  test('buildQueryKey returns undefined when no entity found', () => {
    const memo = new SimpleMemoCache();

    const state = {
      entities: {
        User: {},
        Group: {},
      },
      indexes: {},
    };

    // No entity exists with id '999'
    const result = memo.memo.buildQueryKey(
      stringAttributeUnion,
      [{ id: '999' }],
      state,
    );
    expect(result).toBeUndefined();
  });

  test('buildQueryKey returns undefined when no args provided', () => {
    const memo = new SimpleMemoCache();

    const state = {
      entities: {},
      indexes: {},
    };

    // No args provided
    const result = memo.memo.buildQueryKey(stringAttributeUnion, [], state);
    expect(result).toBeUndefined();
  });
});

describe('complex case', () => {
  test('works with undefined', () => {
    const response = {
      sequences: [
        null,
        undefined,
        {
          group_a_stats: {
            count: 79557,
            sum: 3727219.2099861577,
          },
          group_b_stats: {
            count: 66794,
            sum: 2999496.370384956,
          },
          sequence_id: 22,
          sequence_type: 'temporal_mean_shift',
          subpops_group_a_incremental_stats: [
            {
              count: 19302,
              sum: 909835.9502538516,
            },
            {
              count: 12452,
              sum: 468902.2598208785,
            },
            {
              count: 29674,
              sum: 1533126.7700431347,
            },
            {
              count: 3979,
              sum: 123931.08003079893,
            },
            {
              count: 3501,
              sum: 173706.13005542755,
            },
          ],
          subpops_group_a_stats: [
            {
              count: 19302,
              sum: 909835.9502538516,
            },
            {
              count: 15550,
              sum: 656345.8200406507,
            },
            {
              count: 38523,
              sum: 1767670.8099250195,
            },
            {
              count: 15778,
              sum: 549563.3501347005,
            },
            {
              count: 20194,
              sum: 951307.5302157328,
            },
          ],
          subpops_group_b_incremental_stats: [
            {
              count: 16022,
              sum: 686623.8400082085,
            },
            {
              count: 10427,
              sum: 632778.0701571181,
            },
            {
              count: 25270,
              sum: 1002223.6299012974,
            },
            {
              count: 3386,
              sum: 104987.2500332594,
            },
            {
              count: 2893,
              sum: 139013.64997577667,
            },
          ],
          subpops_group_b_stats: [
            {
              count: 16022,
              sum: 686623.8400082085,
            },
            {
              count: 12964,
              sum: 713309.7901891638,
            },
            {
              count: 32773,
              sum: 1542281.990038909,
            },
            {
              count: 12722,
              sum: 423195.7500065565,
            },
            {
              count: 17110,
              sum: 768182.7200815715,
            },
          ],
          subpopulations: [
            [
              {
                absolute_range: null,
                factor_type: 'value',
                keyword: null,
                percentile_range: null,
                value: {
                  column: 'loyalty_program',
                  data_type: 'string',
                  value: 'none',
                },
              },
            ],
            [
              {
                absolute_range: null,
                factor_type: 'value',
                keyword: null,
                percentile_range: null,
                value: {
                  column: 'coupon_code',
                  data_type: 'string',
                  value: '01DEC2019PROMO',
                },
              },
            ],
            [
              {
                absolute_range: null,
                factor_type: 'value',
                keyword: null,
                percentile_range: null,
                value: {
                  column: 'loyalty_program',
                  data_type: 'string',
                  value: 'silver',
                },
              },
            ],
            [
              {
                absolute_range: null,
                factor_type: 'value',
                keyword: null,
                percentile_range: null,
                value: {
                  column: 'ad_shown',
                  data_type: 'string',
                  value: 'week52_20',
                },
              },
            ],
            [
              {
                absolute_range: null,
                factor_type: 'value',
                keyword: null,
                percentile_range: null,
                value: {
                  column: 'day_part',
                  data_type: 'string',
                  value: 'afternoon',
                },
              },
            ],
          ],
        },
      ],
    };
    const denorm = normalize(waterfallSchema, response);
    expect(denorm).toMatchSnapshot();
    expect(
      new SimpleMemoCache().denormalize(
        waterfallSchema,
        denorm.result,
        denorm.entities,
      ),
    ).toMatchSnapshot();
  });
});

class User extends IDEntity {}
class Group extends IDEntity {}
const entities = {
  User: {
    1: { id: '1', username: 'Janey', type: 'users' },
  },
  Group: {
    2: { id: '2', groupname: 'People', type: 'groups' },
  },
};
describe.each([
  ['direct', plainDenormalize, data => data, data => data],
  ['immutable', immDenormalize, fromJS, fromJSEntities],
])(`input (%s)`, (_, denormalize, createInput, createEntities) => {
  describe.each([['current', denormalize]])(
    `${schema.Union.name} denormalization (%s)`,
    (_, denormalize) => {
      test('denormalizes an object using string schemaAttribute', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          'type',
        );

        expect(
          denormalize(
            union,
            createInput({ id: '1', schema: 'users' }),
            createEntities(entities),
          ),
        ).toMatchSnapshot();

        expect(
          denormalize(
            union,
            createInput({ id: '2', schema: 'groups' }),
            createEntities(entities),
          ),
        ).toMatchSnapshot();
      });

      test('denormalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          input => {
            return input.username ? 'users' : 'groups';
          },
        );

        expect(
          denormalize(
            union,
            createInput({ id: '1', schema: 'users' }),
            createEntities(entities),
          ),
        ).toMatchSnapshot();

        expect(
          denormalize(
            union,
            createInput({ id: '2', schema: 'groups' }),
            createEntities(entities),
          ),
        ).toMatchSnapshot();
      });

      test('returns the original value when no schema is given', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          input => {
            return (
              input.username ? 'users'
              : input.groupname ? 'groups'
              : undefined
            );
          },
        );

        expect(
          denormalize(
            union,
            createInput({ id: '1' }),
            createEntities(entities),
          ),
        ).toMatchSnapshot();
        expect(warnSpy.mock.calls).toMatchSnapshot();
      });

      test('returns the original value when string is given', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          input => {
            return (
              input.username ? 'users'
              : input.groupname ? 'groups'
              : undefined
            );
          },
        );

        expect(
          denormalize(union, '1', createEntities(entities)),
        ).toMatchSnapshot();
        expect(warnSpy.mock.calls).toMatchSnapshot();
      });

      test('returns the original value when null is given', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          input => {
            return (
              input.username ? 'users'
              : input.groupname ? 'groups'
              : undefined
            );
          },
        );

        expect(denormalize(union, null, createEntities(entities))).toBeNull();
      });

      test('returns the original value when undefined is given', () => {
        const union = new Union(
          {
            users: User,
            groups: Group,
          },
          input => {
            return (
              input.username ? 'users'
              : input.groupname ? 'groups'
              : undefined
            );
          },
        );

        expect(
          denormalize(union, undefined, createEntities(entities)),
        ).toBeUndefined();
      });
    },
  );
});
