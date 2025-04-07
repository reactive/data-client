// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { SimpleMemoCache, fromJSEntities } from './denormalize';
import { schema } from '../../';
import { INVALID } from '../../special';
import Entity from '../Entity';

let dateSpy;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class Cat extends IDEntity {
  type = '';
}
class Dog extends IDEntity {
  type = '';
}

describe(`${schema.Values.name} normalization`, () => {
  let warnSpy;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() =>
    (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {}),
  );

  test('normalizes without schemaAttribute', () => {
    class MyEntity extends IDEntity {
      name = '';
    }
    const valuesSchema = new schema.Values(MyEntity);

    expect(
      normalize(valuesSchema, {
        first: {
          id: '1',
          name: 'first thing',
        },
        second: {
          id: '2',
          name: 'second thing',
        },
      }),
    ).toMatchSnapshot();
  });

  test('normalizes the values of an object with the given schema', () => {
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      entity => entity.type,
    );

    expect(
      normalize(valuesSchema, {
        fido: { id: '1', type: 'dogs' },
        fluffy: { id: '1', type: 'cats' },
      }),
    ).toMatchSnapshot();
  });

  test('can use a function to determine the schema when normalizing', () => {
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      entity => `${entity.type}s`,
    );

    expect(
      normalize(valuesSchema, {
        fido: { id: '1', type: 'dog' },
        fluffy: { id: '1', type: 'cat' },
        jim: { id: '2', type: 'lizard' },
      }),
    ).toMatchSnapshot();
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });

  test('filters out null and undefined values', () => {
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      entity => entity.type,
    );

    expect(
      normalize(valuesSchema, {
        fido: undefined,
        milo: null,
        fluffy: { id: '1', type: 'cats' },
      }),
    ).toMatchSnapshot();
  });

  test('works on complex object', () => {
    class Estimate extends Entity {
      pk() {
        return this.fee.currency;
      }
    }
    const response = {
      data: {
        estimates: {
          BTC: {
            confirmation_duration: 900,
            exchange: {
              rate: '6820.07',
              local: 'USD',
              crypto: 'BTC',
            },
            fee_per_kb: {
              amount: '0.00016566',
              currency: 'BTC',
            },
            fee: {
              amount: '0.00002270',
              currency: 'BTC',
            },
            priority: 'fast',
            recipient_value: {
              amount: '0.00054147',
              currency: 'BTC',
            },
            exchange_to_proceeds: {
              rate: '6820.07',
              local: 'EUR',
              crypto: 'BTC',
            },
            min_order_size: {
              amount: '0.001',
              currency: 'BTC',
            },
            coinbase_fees: {
              amount: '0.00002270',
              currency: 'BTC',
            },
          },
          ETH: {
            confirmation_duration: 900,
            exchange: {
              rate: '197.07',
              local: 'USD',
              crypto: 'ETH',
            },
            fee_per_kb: {
              amount: '0.00086',
              currency: 'ETH',
            },
            fee: {
              amount: '0.03795',
              currency: 'ETH',
            },
            priority: 'fast',
            recipient_value: {
              amount: '2.53',
              currency: 'ETH',
            },
            exchange_to_proceeds: {
              rate: '6820.07',
              local: 'EUR',
              crypto: 'BTC',
            },
            min_order_size: {
              amount: '0.001',
              currency: 'BTC',
            },
            coinbase_fees: {
              amount: '0.00002270',
              currency: 'BTC',
            },
          },
        },
      },
    };
    expect(
      normalize({ data: { estimates: new schema.Values(Estimate) } }, response),
    ).toMatchSnapshot();
  });
});

describe.each([
  ['direct', data => data],
  ['immutable', fromJSEntities],
])(`input (%s)`, (_, createInput) => {
  describe.each([['current', new SimpleMemoCache().denormalize]])(
    `${schema.Values.name} denormalization (%s)`,
    (_, denormalize) => {
      test('denormalizes without schemaAttribute', () => {
        class MyEntity extends IDEntity {
          name = '';
        }
        const valuesSchema = new schema.Values(MyEntity);

        const entities = {
          MyEntity: {
            1: {
              id: '1',
              name: 'first thing',
            },
            2: {
              id: '2',
              name: 'second thing',
            },
          },
        };

        expect(
          denormalize(
            valuesSchema,
            {
              first: '1',
              second: '2',
            },
            createInput(entities),
          ),
        ).toMatchSnapshot();
      });

      test('denormalizes the values of an object with the given schema', () => {
        const valuesSchema = new schema.Values(
          {
            dogs: Dog,
            cats: Cat,
          },
          entity => entity.type,
        );

        const entities = {
          Cat: { 1: { id: '1', type: 'cats' } },
          Dog: { 1: { id: '1', type: 'dogs' } },
        };

        expect(
          denormalize(
            valuesSchema,
            {
              fido: { id: '1', schema: 'dogs' },
              fluffy: { id: '1', schema: 'cats' },
            },
            createInput(entities),
          ),
        ).toMatchSnapshot();
      });

      test('denormalizes with missing entity should have false second value', () => {
        const valuesSchema = new schema.Values(
          {
            dogs: Dog,
            cats: Cat,
          },
          entity => entity.type,
        );

        const entities = {
          Cat: { 1: { id: '1', type: 'cats' } },
          Dog: { 1: { id: '1', type: 'dogs' } },
        };

        expect(
          denormalize(
            valuesSchema,
            {
              fido: { id: '1', schema: 'dogs' },
              fluffy: { id: '1', schema: 'cats' },
              prancy: { id: '5', schema: 'cats' },
            },
            createInput(entities),
          ),
        ).toMatchSnapshot();
      });

      test('denormalizes with deleted entity should just remove them', () => {
        const valuesSchema = new schema.Values(
          {
            dogs: Dog,
            cats: Cat,
          },
          entity => entity.type,
        );

        const entities = {
          Cat: { 1: { id: '1', type: 'cats' }, 5: INVALID },
          Dog: { 1: { id: '1', type: 'dogs' } },
        };

        expect(
          denormalize(
            valuesSchema,
            {
              fido: { id: '1', schema: 'dogs' },
              fluffy: { id: '1', schema: 'cats' },
              prancy: { id: '5', schema: 'cats' },
            },
            createInput(entities),
          ),
        ).toMatchSnapshot();
      });

      test('works on complex object', () => {
        class Estimate extends Entity {
          pk() {
            return this.fee.currency;
          }
        }
        const response = {
          data: {
            estimates: {
              BTC: {
                confirmation_duration: 900,
                exchange: {
                  rate: '6820.07',
                  local: 'USD',
                  crypto: 'BTC',
                },
                fee_per_kb: {
                  amount: '0.00016566',
                  currency: 'BTC',
                },
                fee: {
                  amount: '0.00002270',
                  currency: 'BTC',
                },
                priority: 'fast',
                recipient_value: {
                  amount: '0.00054147',
                  currency: 'BTC',
                },
                exchange_to_proceeds: {
                  rate: '6820.07',
                  local: 'EUR',
                  crypto: 'BTC',
                },
                min_order_size: {
                  amount: '0.001',
                  currency: 'BTC',
                },
                coinbase_fees: {
                  amount: '0.00002270',
                  currency: 'BTC',
                },
              },
              ETH: {
                confirmation_duration: 900,
                exchange: {
                  rate: '197.07',
                  local: 'USD',
                  crypto: 'ETH',
                },
                fee_per_kb: {
                  amount: '0.00086',
                  currency: 'ETH',
                },
                fee: {
                  amount: '0.03795',
                  currency: 'ETH',
                },
                priority: 'fast',
                recipient_value: {
                  amount: '2.53',
                  currency: 'ETH',
                },
                exchange_to_proceeds: {
                  rate: '6820.07',
                  local: 'EUR',
                  crypto: 'BTC',
                },
                min_order_size: {
                  amount: '0.001',
                  currency: 'BTC',
                },
                coinbase_fees: {
                  amount: '0.00002270',
                  currency: 'BTC',
                },
              },
            },
          },
        };
        const shape = new schema.Object({
          data: new schema.Object({ estimates: new schema.Values(Estimate) }),
        });
        const { result, entities } = normalize(shape, response);
        expect(
          denormalize(shape, result, createInput(entities)),
        ).toMatchSnapshot();
      });
    },
  );
});
