import { Endpoint, Entity, Scalar, schema } from '@data-client/endpoint';

import { ExpiryStatus } from '../..';
import { initialState } from '../../state/reducer/createReducer';
import Contoller from '../Controller';

describe('Controller.getResponse()', () => {
  it('denormalizes schema with extra members but not set', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
    }
    const ep = new Endpoint(() => Promise.resolve(), {
      key() {
        return 'mytest';
      },
      schema: {
        data: [Tacos],
        extra: '',
        page: {
          first: null,
          second: undefined,
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
      endpoints: {
        [ep.key()]: {
          data: ['1', '2'],
        },
      },
    };
    const { data, expiryStatus } = controller.getResponse(ep, state);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
  });

  it('denormalizes distinct schemas for null arg', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
      pk() {
        return this.id;
      }
    }
    const ep = new Endpoint(() => Promise.resolve(), {
      key() {
        return 'mytest';
      },
      schema: {
        data: [Tacos],
        extra: '',
        page: {
          first: null,
          second: undefined,
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
      endpoints: {
        [ep.key()]: {
          data: ['1', '2'],
        },
      },
    };
    const { data, expiryStatus } = controller.getResponse(ep, null, state);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    // null args means don't fill anything in
    expect(data.data).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "extra": "",
        "page": {
          "complex": {
            "complex": true,
            "next": false,
          },
          "first": null,
          "second": undefined,
          "third": 0,
        },
      }
    `);
    expect(controller.getResponse(ep, null, state).data).toStrictEqual(data);

    const ep2 = ep.extend({ schema: { data: Tacos, nextPage: { five: '5' } } });
    const data2 = controller.getResponse(ep2, null, state).data;
    expect(data2.data).toBeUndefined();
    expect(data2).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "nextPage": {
          "five": "5",
        },
      }
    `);
  });

  it('does not over-denormalize a schema map containing string values', () => {
    // Regression: `String.prototype.normalize` made string leaves look like schemas.
    const controller = new Contoller();
    const ep = new Endpoint(() => Promise.resolve(), {
      key() {
        return 'string-only-schema';
      },
      schema: { label: 'hello', count: 0, nested: { value: 'world' } },
    });
    const cached = { label: 'hi', count: 5, nested: { value: 'there' } };
    const state = {
      ...initialState,
      endpoints: { [ep.key()]: cached },
    };
    const { data, expiryStatus } = controller.getResponse(ep, state);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    // Reference equality — denormalize must be skipped for entity-free schemas.
    expect(data).toBe(cached);
  });

  it('infers schema with extra members but not set', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
    }
    const ep = new Endpoint(({ id }: { id: string }) => Promise.resolve(), {
      key({ id }) {
        return `mytest ${id}`;
      },
      schema: {
        data: Tacos,
        extra: '',
        page: {
          first: null,
          second: '',
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
      entitiesMeta: {
        Tacos: {
          1: { date: 1000000, expiresAt: 1100000, fetchedAt: 1000000 },
          2: { date: 2000000, expiresAt: 2100000, fetchedAt: 2000000 },
        },
      },
    };
    const { data, expiryStatus, expiresAt } = controller.getResponse(
      ep,
      { id: '1' },
      state,
    );
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
    expect(expiresAt).toBe(1100000);
    // test caching
    const second = controller.getResponse(ep, { id: '1' }, state);
    expect(second.data.data).toBe(data.data);
    expect(second.expiryStatus).toBe(expiryStatus);
    expect(second.expiresAt).toBe(expiresAt);
  });
});

describe('Controller.getResponse() with Scalar', () => {
  // Regression: `requiresDenormalize` (formerly `schemaHasEntity`) previously
  // walked `Object.values(scalar)` and recursed into the `lensSelector`
  // function, causing infinite recursion (RangeError). The table-resident
  // Scalar schema (no `pk`) was also not recognized, so `Values(Scalar)`
  // returned false and Controller skipped denormalization — returning raw
  // cpk strings instead of the joined cell data. See
  // packages/core/src/controller/Controller.ts `requiresDenormalize`.

  class Company extends Entity {
    id = '';
    price = 0;
    pct_equity = 0;
    shares = 0;

    static key = 'Company';
  }
  const PortfolioScalar = new Scalar({
    lens: (args: readonly any[]) => args[0]?.portfolio,
    key: 'portfolio',
    entity: Company,
  });
  Company.schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  } as any;

  // Hard cap so a regression that re-introduces infinite recursion fails
  // immediately rather than appearing as a generic Jest timeout.
  const FAST_TIMEOUT = 2000;

  it(
    'denormalizes Values(Scalar) cells without infinite recursion',
    () => {
      const controller = new Contoller();
      const ep = new Endpoint(
        ({ portfolio }: { portfolio: string }) => Promise.resolve(),
        {
          key: ({ portfolio }) => `getColumns ${portfolio}`,
          schema: new schema.Values(PortfolioScalar),
        },
      );

      const state = {
        ...initialState,
        entities: {
          'Scalar(portfolio)': {
            'Company|1|A': { pct_equity: 0.5, shares: 100 },
            'Company|2|A': { pct_equity: 0.2, shares: 40 },
          },
        },
        endpoints: {
          [ep.key({ portfolio: 'A' })]: {
            '1': 'Company|1|A',
            '2': 'Company|2|A',
          },
        },
      };

      let result: ReturnType<typeof controller.getResponse>;
      expect(() => {
        result = controller.getResponse(ep, { portfolio: 'A' }, state);
      }).not.toThrow();

      expect(result!.expiryStatus).toBe(ExpiryStatus.Valid);
      // Critical: cells are joined, not raw cpk strings — proves
      // `requiresDenormalize` returned true so denormalize ran.
      expect(result!.data).toEqual({
        '1': { pct_equity: 0.5, shares: 100 },
        '2': { pct_equity: 0.2, shares: 40 },
      });
    },
    FAST_TIMEOUT,
  );

  it(
    'denormalizes Entity with Scalar field schema without infinite recursion',
    () => {
      const controller = new Contoller();
      const ep = new Endpoint(
        ({ portfolio }: { portfolio: string }) => Promise.resolve(),
        {
          key: ({ portfolio }) => `getCompanies ${portfolio}`,
          schema: [Company],
        },
      );

      const state = {
        ...initialState,
        entities: {
          Company: {
            '1': {
              id: '1',
              price: 100,
              pct_equity: ['1', 'pct_equity', 'Company'],
              shares: ['1', 'shares', 'Company'],
            },
          },
          'Scalar(portfolio)': {
            'Company|1|A': { pct_equity: 0.5, shares: 100 },
          },
        },
        endpoints: {
          [ep.key({ portfolio: 'A' })]: ['1'],
        },
      };

      let result: ReturnType<typeof controller.getResponse>;
      expect(() => {
        result = controller.getResponse(ep, { portfolio: 'A' }, state);
      }).not.toThrow();

      expect(result!.expiryStatus).toBe(ExpiryStatus.Valid);
      const company = (result!.data as any[])[0];
      expect(company.id).toBe('1');
      expect(company.price).toBe(100);
      expect(company.pct_equity).toBe(0.5);
      expect(company.shares).toBe(100);
    },
    FAST_TIMEOUT,
  );
});

describe('Snapshot.getResponseMeta()', () => {
  it('denormalizes schema with extra members but not set', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
    }
    const ep = new Endpoint(() => Promise.resolve(), {
      key() {
        return 'mytest';
      },
      schema: {
        data: [Tacos],
        extra: '',
        page: {
          first: null,
          second: undefined,
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
      endpoints: {
        [ep.key()]: {
          data: ['1', '2'],
        },
      },
    };
    const { data, expiryStatus } = controller
      .snapshot(state)
      .getResponseMeta(ep);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
  });
});
