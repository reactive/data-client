// eslint-env jest
import { fromJS } from 'immutable';
import { normalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import Entity from '../Entity';
import denormalize from './denormalize';
import { schema } from '../../';
import { DELETED } from '../../special';

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

class Cat extends IDEntity {
  type = '';
}
class Dog extends IDEntity {
  type = '';
}

describe(`${schema.Values.name} normalization`, () => {
  test('normalizes without schemaAttribute', () => {
    class MyEntity extends IDEntity {
      name = '';
    }
    const valuesSchema = new schema.Values(MyEntity);

    expect(
      normalize(
        {
          first: {
            id: '1',
            name: 'first thing',
          },
          second: {
            id: '2',
            name: 'second thing',
          },
        },
        valuesSchema,
      ),
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
      normalize(
        {
          fido: { id: '1', type: 'dogs' },
          fluffy: { id: '1', type: 'cats' },
        },
        valuesSchema,
      ),
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
      normalize(
        {
          fido: { id: '1', type: 'dog' },
          fluffy: { id: '1', type: 'cat' },
          jim: { id: '2', type: 'lizard' },
        },
        valuesSchema,
      ),
    ).toMatchSnapshot();
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
      normalize(
        {
          fido: undefined,
          milo: null,
          fluffy: { id: '1', type: 'cats' },
        },
        valuesSchema,
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
    expect(
      normalize(response, { data: { estimates: new schema.Values(Estimate) } }),
    ).toMatchSnapshot();
  });
});

describe(`${schema.Values.name} denormalization`, () => {
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
        {
          first: '1',
          second: '2',
        },
        valuesSchema,
        entities,
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
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
        },
        valuesSchema,
        entities,
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
        },
        valuesSchema,
        fromJS(entities),
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
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
          prancy: { id: '5', schema: 'cats' },
        },
        valuesSchema,
        entities,
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
          prancy: { id: '5', schema: 'cats' },
        },
        valuesSchema,
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes with deleted entity should have false third value', () => {
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      entity => entity.type,
    );

    const entities = {
      Cat: { 1: { id: '1', type: 'cats' }, 5: DELETED },
      Dog: { 1: { id: '1', type: 'dogs' } },
    };

    expect(
      denormalize(
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
          prancy: { id: '5', schema: 'cats' },
        },
        valuesSchema,
        entities,
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        {
          fido: { id: '1', schema: 'dogs' },
          fluffy: { id: '1', schema: 'cats' },
          prancy: { id: '5', schema: 'cats' },
        },
        valuesSchema,
        fromJS(entities),
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
    const shape = { data: { estimates: new schema.Values(Estimate) } };
    const { result, entities } = normalize(response, shape);
    expect(denormalize(result, shape, entities)[0]).toMatchSnapshot();
  });
});
