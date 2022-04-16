// eslint-env jest
import { fromJS } from 'immutable';
import { waterfallSchema } from '__tests__/UnionSchema';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';

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

describe(`${schema.Union.name} normalization`, () => {
  test('throws if not given a schemaAttribute', () => {
    expect(() => new schema.Union({})).toThrow();
  });

  test('normalizes an object using string schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );

    expect(normalize({ id: '1', type: 'users' }, union)).toMatchSnapshot();
    expect(normalize({ id: '2', type: 'groups' }, union)).toMatchSnapshot();
  });

  test('normalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : input.groupname ? 'groups' : null;
      },
    );

    expect(normalize({ id: '1', username: 'Janey' }, union)).toMatchSnapshot();
    expect(
      normalize({ id: '2', groupname: 'People' }, union),
    ).toMatchSnapshot();
    expect(normalize({ id: '3', notdefined: 'yep' }, union)).toMatchSnapshot();
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
    const denorm = normalize(response, waterfallSchema);
    expect(denorm).toMatchSnapshot();
    expect(
      denormalize(denorm.result, waterfallSchema, denorm.entities),
    ).toMatchSnapshot();
  });
});

describe(`${schema.Union.name} denormalization`, () => {
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

  test('denormalizes an object using string schemaAttribute', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );

    expect(
      denormalize({ id: '1', schema: 'users' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ id: '1', schema: 'users' }),
        union,
        fromJS(entities),
      ),
    ).toMatchSnapshot();

    expect(
      denormalize({ id: '2', schema: 'groups' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ id: '2', schema: 'groups' }),
        union,
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : 'groups';
      },
    );

    expect(
      denormalize({ id: '1', schema: 'users' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ id: '1', schema: 'users' }),
        union,
        fromJS(entities),
      ),
    ).toMatchSnapshot();

    expect(
      denormalize({ id: '2', schema: 'groups' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ id: '2', schema: 'groups' }),
        union,
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });

  test('returns the original value when no schema is given', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : 'groups';
      },
    );

    expect(denormalize({ id: '1' }, union, entities)).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: '1' }), union, fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('returns the original value when string is given', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : 'groups';
      },
    );

    expect(denormalize('1', union, entities)).toMatchSnapshot();
  });
});
