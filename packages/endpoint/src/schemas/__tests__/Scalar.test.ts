// eslint-env jest
import { normalize, denormalize, MemoCache } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { SimpleMemoCache } from './denormalize';
import { schema, Scalar } from '../..';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class Company extends IDEntity {
  price = 0;
  pct_equity = 0;
  shares = 0;

  static key = 'Company';
}
// Bound to Company so the Values-only column-fetch tests below also work.
// (When a Scalar is only ever used as an Entity field, `entity` can be omitted.)
const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});
Company.schema = {
  pct_equity: PortfolioScalar,
  shares: PortfolioScalar,
} as any;

describe('Scalar', () => {
  describe('normalize', () => {
    it('stores scalar fields in Scalar and wrapper refs in entity', () => {
      const result = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      // Entity stores wrapper refs, not raw scalar values
      const companyEntity = result.entities['Company']?.['1'];
      expect(companyEntity).toBeDefined();
      expect(companyEntity.id).toBe('1');
      expect(companyEntity.price).toBe(100);
      expect(companyEntity.pct_equity).toEqual({
        id: '1',
        field: 'pct_equity',
        entityKey: 'Company',
      });
      expect(companyEntity.shares).toEqual({
        id: '1',
        field: 'shares',
        entityKey: 'Company',
      });

      // Scalar stores the grouped data
      const cellKey = 'Scalar(portfolio)';
      const cpk = 'Company|1|portfolioA';
      const cell = result.entities[cellKey]?.[cpk];
      expect(cell).toBeDefined();
      expect(cell.pct_equity).toBe(0.5);
      expect(cell.shares).toBe(32342);
    });

    it.each([
      ['zero', 0],
      ['empty string', ''],
      ['false', false],
    ])('normalizes falsy scalar value (%s) into the cell', (_label, value) => {
      const result = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: value, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      // Entity must store a wrapper, not the raw falsy value.
      const companyEntity = result.entities['Company']?.['1'];
      expect(companyEntity.pct_equity).toEqual({
        id: '1',
        field: 'pct_equity',
        entityKey: 'Company',
      });

      // Scalar cell must record the falsy value verbatim.
      const cell =
        result.entities['Scalar(portfolio)']?.['Company|1|portfolioA'];
      expect(cell).toBeDefined();
      expect(cell.pct_equity).toBe(value);
      expect(cell.shares).toBe(32342);
    });

    it('round-trips falsy scalar values through denormalize', () => {
      const state = normalize(
        [Company],
        [{ id: '1', price: 0, pct_equity: 0, shares: 0 }],
        [{ portfolio: 'portfolioA' }],
      );

      const memo = new SimpleMemoCache();
      const result = memo.denormalize([Company], state.result, state.entities, [
        { portfolio: 'portfolioA' },
      ]) as any[];

      expect(result[0].pct_equity).toBe(0);
      expect(result[0].shares).toBe(0);
      expect(result[0].price).toBe(0);
    });

    it('handles multiple entities in array', () => {
      const result = normalize(
        [Company],
        [
          { id: '1', price: 100, pct_equity: 0.5, shares: 32342 },
          { id: '2', price: 200, pct_equity: 0.3, shares: 1000 },
        ],
        [{ portfolio: 'portfolioA' }],
      );

      const cellKey = 'Scalar(portfolio)';
      expect(result.entities[cellKey]?.['Company|1|portfolioA']).toEqual({
        pct_equity: 0.5,
        shares: 32342,
      });
      expect(result.entities[cellKey]?.['Company|2|portfolioA']).toEqual({
        pct_equity: 0.3,
        shares: 1000,
      });
    });

    it('normalizes different lenses into separate cells', () => {
      const stateA = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );
      const stateB = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.3, shares: 323 }],
        [{ portfolio: 'portfolioB' }],
        stateA,
      );

      const cellKey = 'Scalar(portfolio)';
      expect(stateB.entities[cellKey]?.['Company|1|portfolioA']).toEqual({
        pct_equity: 0.5,
        shares: 32342,
      });
      expect(stateB.entities[cellKey]?.['Company|1|portfolioB']).toEqual({
        pct_equity: 0.3,
        shares: 323,
      });
    });
  });

  describe('denormalize', () => {
    it('joins scalar cell data based on lens args', () => {
      const state = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      const memo = new SimpleMemoCache();
      const result = memo.denormalize([Company], state.result, state.entities, [
        { portfolio: 'portfolioA' },
      ]) as any[];

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].price).toBe(100);
      expect(result[0].pct_equity).toBe(0.5);
      expect(result[0].shares).toBe(32342);
    });

    it('different lens args produce different results from same entity', () => {
      const stateA = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );
      const stateB = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.3, shares: 323 }],
        [{ portfolio: 'portfolioB' }],
        stateA,
      );

      // Use separate memo instances since different args produce different results
      const memoA = new SimpleMemoCache();
      const memoB = new SimpleMemoCache();

      const resultA = memoA.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioA' }],
      ) as any[];
      expect(resultA[0].pct_equity).toBe(0.5);
      expect(resultA[0].shares).toBe(32342);

      const resultB = memoB.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioB' }],
      ) as any[];
      expect(resultB[0].pct_equity).toBe(0.3);
      expect(resultB[0].shares).toBe(323);

      // Non-scalar fields are the same
      expect(resultA[0].id).toBe('1');
      expect(resultB[0].id).toBe('1');
      expect(resultA[0].price).toBe(100);
      expect(resultB[0].price).toBe(100);
    });

    it('returns undefined for scalar fields when lens is missing from args', () => {
      const state = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      const memo = new SimpleMemoCache();
      const result = memo.denormalize([Company], state.result, state.entities, [
        {},
      ]) as any[];

      expect(result[0].id).toBe('1');
      expect(result[0].price).toBe(100);
      expect(result[0].pct_equity).toBeUndefined();
      expect(result[0].shares).toBeUndefined();
    });
  });

  describe('column-only fetch via Values', () => {
    it('stores cells without modifying Company entities', () => {
      // First: full entity fetch to establish Company entities and _entityKey
      const initial = normalize(
        [Company],
        [
          { id: '1', price: 100, pct_equity: 0.5, shares: 32342 },
          { id: '2', price: 200, pct_equity: 0.3, shares: 1000 },
        ],
        [{ portfolio: 'portfolioA' }],
      );

      // Column-only fetch for portfolioB
      const columnResult = normalize(
        new schema.Values(PortfolioScalar),
        {
          '1': { pct_equity: 0.7, shares: 555 },
          '2': { pct_equity: 0.1, shares: 999 },
        },
        [{ portfolio: 'portfolioB' }],
        initial,
      );

      // Company entities should not have changed
      expect(columnResult.entities['Company']?.['1'].price).toBe(100);
      expect(columnResult.entities['Company']?.['2'].price).toBe(200);

      // New Scalar entries for portfolioB
      const cellKey = 'Scalar(portfolio)';
      expect(columnResult.entities[cellKey]?.['Company|1|portfolioB']).toEqual({
        pct_equity: 0.7,
        shares: 555,
      });
      expect(columnResult.entities[cellKey]?.['Company|2|portfolioB']).toEqual({
        pct_equity: 0.1,
        shares: 999,
      });

      // Original portfolioA cells still intact
      expect(columnResult.entities[cellKey]?.['Company|1|portfolioA']).toEqual({
        pct_equity: 0.5,
        shares: 32342,
      });
    });

    it('column fetch cells are joinable via denormalize', () => {
      const initial = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      const withB = normalize(
        new schema.Values(PortfolioScalar),
        { '1': { pct_equity: 0.7, shares: 555 } },
        [{ portfolio: 'portfolioB' }],
        initial,
      );

      const memo = new SimpleMemoCache();

      // Denormalize with portfolioB lens → sees column fetch data
      const result = memo.denormalize(
        [Company],
        initial.result,
        withB.entities,
        [{ portfolio: 'portfolioB' }],
      ) as any[];

      expect(result[0].pct_equity).toBe(0.7);
      expect(result[0].shares).toBe(555);
      expect(result[0].price).toBe(100);
    });
  });

  describe('composite primary keys containing "|"', () => {
    class CompositeCompany extends IDEntity {
      type = '';
      num = '';
      price = 0;
      pct_equity = 0;
      shares = 0;

      pk(): string {
        return `${this.type}|${this.num}`;
      }

      static key = 'CompositeCompany';
    }
    const CompositeScalar = new Scalar({
      lens: args => args[0]?.portfolio,
      key: 'portfolio-composite',
      entity: CompositeCompany,
    });
    CompositeCompany.schema = {
      pct_equity: CompositeScalar,
      shares: CompositeScalar,
    } as any;

    it('entity-path cpk is consistent with Values-path cpk', () => {
      const initial = normalize(
        [CompositeCompany],
        [
          {
            id: '1',
            type: 'type',
            num: '123',
            price: 100,
            pct_equity: 0.5,
            shares: 32342,
          },
        ],
        [{ portfolio: 'portfolioA' }],
      );

      const cellKey = 'Scalar(portfolio-composite)';
      const expectedCpk = 'CompositeCompany|type|123|portfolioA';
      expect(initial.entities[cellKey]?.[expectedCpk]).toEqual({
        pct_equity: 0.5,
        shares: 32342,
      });

      const wrapper =
        initial.entities['CompositeCompany']?.['type|123']?.pct_equity;
      expect(wrapper).toEqual({
        id: 'type|123',
        field: 'pct_equity',
        entityKey: 'CompositeCompany',
      });

      const withB = normalize(
        new schema.Values(CompositeScalar),
        { 'type|123': { pct_equity: 0.7, shares: 555 } },
        [{ portfolio: 'portfolioB' }],
        initial,
      );

      expect(
        withB.entities[cellKey]?.['CompositeCompany|type|123|portfolioB'],
      ).toEqual({
        pct_equity: 0.7,
        shares: 555,
      });

      const memo = new SimpleMemoCache();
      const result = memo.denormalize(
        [CompositeCompany],
        initial.result,
        withB.entities,
        [{ portfolio: 'portfolioB' }],
      ) as any[];

      expect(result[0].pct_equity).toBe(0.7);
      expect(result[0].shares).toBe(555);
      expect(result[0].price).toBe(100);
    });
  });

  describe('merge accumulation', () => {
    it('merges new scalar fields into existing cells', () => {
      const state1 = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );

      // Re-normalize same entity with updated scalar values
      const state2 = normalize(
        [Company],
        [{ id: '1', price: 105, pct_equity: 0.55, shares: 33000 }],
        [{ portfolio: 'portfolioA' }],
        state1,
      );

      const cellKey = 'Scalar(portfolio)';
      const cell = state2.entities[cellKey]?.['Company|1|portfolioA'];
      expect(cell.pct_equity).toBe(0.55);
      expect(cell.shares).toBe(33000);

      // Company entity updated too (price changed)
      expect(state2.entities['Company']?.['1'].price).toBe(105);
    });
  });

  describe('Scalar constructor', () => {
    it('sets key, lensSelector, and entityKey when bound', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'test',
        entity: Company,
      });
      expect(s.key).toBe('Scalar(test)');
      expect(s.lensSelector([{ portfolio: 'abc' }])).toBe('abc');
      expect(s.entityKey).toBe('Company');
    });

    it('leaves entityKey undefined when `entity` is omitted', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'test',
      });
      expect(s.entityKey).toBeUndefined();
    });

    it('queryKey returns undefined', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'test',
      });
      expect(s.queryKey([], undefined, {} as any)).toBeUndefined();
    });

    it('throws when used inside Values without an `entity` binding', () => {
      const Unbound = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'unbound',
      });
      expect(() =>
        normalize(new schema.Values(Unbound), { '1': { x: 1 } }, [
          { portfolio: 'p' },
        ]),
      ).toThrow(/entity/);
    });
  });

  describe('multi-entity sharing (regression)', () => {
    // A single Scalar instance shared across multiple entity types: the entity
    // key is inferred at normalize time from the parent Entity class and stored
    // on the wrapper, so denormalize resolves to the correct cell regardless of
    // normalization order.
    class Fund extends IDEntity {
      price = 0;
      pct_equity = 0;

      static key = 'Fund';
    }
    const SharedPortfolio = new Scalar({
      lens: args => args[0]?.portfolio,
      key: 'portfolio-shared',
    });
    class Co extends IDEntity {
      price = 0;
      pct_equity = 0;
      static key = 'Co';
      static schema = { pct_equity: SharedPortfolio };
    }
    Fund.schema = { pct_equity: SharedPortfolio } as any;

    it('normalizes Co and Fund into distinct cells without cross-contamination', () => {
      const state = normalize(
        [Co],
        [{ id: '1', price: 100, pct_equity: 0.5 }],
        [{ portfolio: 'portfolioA' }],
      );
      const state2 = normalize(
        [Fund],
        [{ id: '1', price: 200, pct_equity: 0.9 }],
        [{ portfolio: 'portfolioA' }],
        state,
      );
      const cellKey = 'Scalar(portfolio-shared)';
      expect(state2.entities[cellKey]?.['Co|1|portfolioA']).toEqual({
        pct_equity: 0.5,
      });
      expect(state2.entities[cellKey]?.['Fund|1|portfolioA']).toEqual({
        pct_equity: 0.9,
      });
    });

    it('denormalizes Co correctly even after Fund was normalized last', () => {
      const state = normalize(
        [Co],
        [{ id: '1', price: 100, pct_equity: 0.5 }],
        [{ portfolio: 'portfolioA' }],
      );
      const state2 = normalize(
        [Fund],
        [{ id: '1', price: 200, pct_equity: 0.9 }],
        [{ portfolio: 'portfolioA' }],
        state,
      );

      const memo = new SimpleMemoCache();
      const coResult = memo.denormalize([Co], state.result, state2.entities, [
        { portfolio: 'portfolioA' },
      ]) as any[];
      expect(coResult[0].pct_equity).toBe(0.5);

      const memo2 = new SimpleMemoCache();
      const fundResult = memo2.denormalize(
        [Fund],
        state2.result,
        state2.entities,
        [{ portfolio: 'portfolioA' }],
      ) as any[];
      expect(fundResult[0].pct_equity).toBe(0.9);
    });
  });

  describe('Values-only fetch without prior entity fetch (regression)', () => {
    it('builds correct compound pks when no entity has been normalized yet', () => {
      const result = normalize(
        new schema.Values(PortfolioScalar),
        {
          '1': { pct_equity: 0.7, shares: 555 },
          '2': { pct_equity: 0.1, shares: 999 },
        },
        [{ portfolio: 'portfolioB' }],
      );

      const cellKey = 'Scalar(portfolio)';
      expect(result.entities[cellKey]).toBeDefined();
      expect(result.entities[cellKey]?.['Company|1|portfolioB']).toEqual({
        pct_equity: 0.7,
        shares: 555,
      });
      expect(result.entities[cellKey]?.['Company|2|portfolioB']).toEqual({
        pct_equity: 0.1,
        shares: 999,
      });
      // Never write a cell with an `undefined` entity-key prefix.
      expect(
        Object.keys(result.entities[cellKey] ?? {}).some(k =>
          k.startsWith('undefined|'),
        ),
      ).toBe(false);
    });
  });
});
