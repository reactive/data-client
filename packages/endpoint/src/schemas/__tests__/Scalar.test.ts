// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { SimpleMemoCache } from './denormalize';
import { Collection, schema, Scalar } from '../..';

/** Minimal IDenormalizeDelegate for direct schema.denormalize() unit tests. */
function makeDelegate(
  args: readonly any[],
  unvisit: (schema: any, input: any) => any,
) {
  return {
    args,
    unvisit,
    argsKey(fn: (args: readonly any[]) => string | undefined) {
      return fn(args);
    },
  };
}

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
      expect(companyEntity.pct_equity).toEqual(['1', 'pct_equity', 'Company']);
      expect(companyEntity.shares).toEqual(['1', 'shares', 'Company']);

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
      expect(companyEntity.pct_equity).toEqual(['1', 'pct_equity', 'Company']);

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

      // A single shared MemoCache must produce different results when only
      // the lens args change — the entity-level cache must bucket by lens.
      const memo = new SimpleMemoCache();

      const resultA = memo.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioA' }],
      ) as any[];
      expect(resultA[0].pct_equity).toBe(0.5);
      expect(resultA[0].shares).toBe(32342);

      const resultB = memo.denormalize(
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

  describe('array-of-records standalone', () => {
    it('normalizes [Scalar] using each item id as the entity pk', () => {
      const state = normalize(
        [PortfolioScalar],
        [
          { id: '1', pct_equity: 0.7, shares: 555 },
          { id: '2', pct_equity: 0.1, shares: 999 },
        ],
        [{ portfolio: 'portfolioB' }],
      );

      expect(state.result).toEqual([
        'Company|1|portfolioB',
        'Company|2|portfolioB',
      ]);
      expect(state.entities['Scalar(portfolio)']).toMatchObject({
        'Company|1|portfolioB': {
          id: '1',
          pct_equity: 0.7,
          shares: 555,
        },
        'Company|2|portfolioB': {
          id: '2',
          pct_equity: 0.1,
          shares: 999,
        },
      });
    });

    it('normalizes Collection([Scalar]) and denormalizes the array round-trip', () => {
      const columns = new Collection([PortfolioScalar], {
        argsKey: ({ portfolio }: { portfolio: string }) => ({ portfolio }),
      });
      const state = normalize(
        columns,
        [
          { id: '1', pct_equity: 0.7, shares: 555 },
          { id: '2', pct_equity: 0.1, shares: 999 },
        ],
        [{ portfolio: 'portfolioB' }],
      );

      expect(state.result).toEqual('{"portfolio":"portfolioB"}');
      expect(state.entities['[Scalar(portfolio)]']).toEqual({
        '{"portfolio":"portfolioB"}': [
          'Company|1|portfolioB',
          'Company|2|portfolioB',
        ],
      });

      const memo = new SimpleMemoCache();
      const result = memo.denormalize(columns, state.result, state.entities, [
        { portfolio: 'portfolioB' },
      ]) as any[];
      expect(result).toEqual([
        { id: '1', pct_equity: 0.7, shares: 555 },
        { id: '2', pct_equity: 0.1, shares: 999 },
      ]);
    });

    it('joins array-fetched cells onto existing entities', () => {
      const initial = normalize(
        [Company],
        [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
        [{ portfolio: 'portfolioA' }],
      );
      const withB = normalize(
        [PortfolioScalar],
        [{ id: '1', pct_equity: 0.7, shares: 555 }],
        [{ portfolio: 'portfolioB' }],
        initial,
      );

      const memo = new SimpleMemoCache();
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

    it('supports subclass entityPk overrides', () => {
      class CompanyIdScalar extends Scalar {
        entityPk(input: any): string | undefined {
          return input?.companyId;
        }
      }
      const CustomScalar = new CompanyIdScalar({
        lens: args => args[0]?.portfolio,
        key: 'custom-portfolio',
        entity: Company,
      });

      const state = normalize(
        [CustomScalar],
        [{ companyId: '1', pct_equity: 0.7, shares: 555 }],
        [{ portfolio: 'portfolioB' }],
      );

      expect(
        state.entities['Scalar(custom-portfolio)']?.['Company|1|portfolioB'],
      ).toEqual({ companyId: '1', pct_equity: 0.7, shares: 555 });
    });

    it('throws when the standalone path cannot derive an entity pk', () => {
      expect(() =>
        normalize(
          [PortfolioScalar],
          [{ pct_equity: 0.7, shares: 555 }],
          [{ portfolio: 'portfolioB' }],
        ),
      ).toThrow(/cannot derive entity pk/);
    });
  });

  describe('nested array-of-records under a plain object schema (regression)', () => {
    // `[Scalar]` (or `Collection([Scalar])`) nested inside a plain object schema
    // — `{ stock: [Scalar] }` — must derive each item's entity pk from the item
    // itself, not from the parent's field name. Previously `Array.normalize`
    // forwarded its enclosing field name (e.g. `'stock'`) as `key` to each
    // child; `Scalar.entityPk` returned that key (since it was non-undefined),
    // collapsing every cell onto compound pk `Company|stock|<lens>` and
    // silently corrupting the data.
    it('keys cells by item id, not by parent field name', () => {
      const objSchema = { stock: [PortfolioScalar] };
      const state = normalize(
        objSchema,
        {
          stock: [
            { id: '1', pct_equity: 0.7, shares: 555 },
            { id: '2', pct_equity: 0.1, shares: 999 },
          ],
        },
        [{ portfolio: 'portfolioB' }],
      );

      expect(state.result).toEqual({
        stock: ['Company|1|portfolioB', 'Company|2|portfolioB'],
      });
      expect(state.entities['Scalar(portfolio)']).toMatchObject({
        'Company|1|portfolioB': {
          id: '1',
          pct_equity: 0.7,
          shares: 555,
        },
        'Company|2|portfolioB': {
          id: '2',
          pct_equity: 0.1,
          shares: 999,
        },
      });
      // Must not key any cell by the parent field name.
      expect(
        Object.keys(state.entities['Scalar(portfolio)'] ?? {}).some(k =>
          k.includes('|stock|'),
        ),
      ).toBe(false);
    });

    it('keys cells by item id when nested as Collection([Scalar])', () => {
      const columns = new Collection([PortfolioScalar], {
        nestKey: (parent: any, key: string) => ({ portfolio: key }),
      });
      const objSchema = { stock: columns };
      const state = normalize(
        objSchema,
        {
          stock: [
            { id: '1', pct_equity: 0.7, shares: 555 },
            { id: '2', pct_equity: 0.1, shares: 999 },
          ],
        },
        [{ portfolio: 'portfolioB' }],
      );

      // Cells are keyed by item id, not by the parent field name.
      expect(state.entities['Scalar(portfolio)']).toMatchObject({
        'Company|1|portfolioB': {
          id: '1',
          pct_equity: 0.7,
          shares: 555,
        },
        'Company|2|portfolioB': {
          id: '2',
          pct_equity: 0.1,
          shares: 999,
        },
      });
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
      expect(wrapper).toEqual(['type|123', 'pct_equity', 'CompositeCompany']);

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

  describe('queryKey', () => {
    // Minimal IQueryDelegate that serves cells from an in-memory map keyed by
    // schema key -> cpk -> cell. Scalar.queryKey only reads getEntities.
    function makeQueryDelegate(
      cells: Record<string, Record<string, any>> = {},
    ) {
      return {
        getEntities(key: string) {
          const table = cells[key];
          if (!table) return undefined;
          return {
            keys: () => Object.keys(table)[Symbol.iterator](),
            entries: () => Object.entries(table)[Symbol.iterator](),
          };
        },
        getEntity: (key: string, pk: string) => cells[key]?.[pk],
        getIndex: () => undefined,
        INVALID: Symbol('INVALID'),
      } as any;
    }

    const LensScalar = new Scalar({
      lens: args => args[0]?.portfolio,
      key: 'portfolio-q',
      entity: Company,
    });

    it('returns undefined when lens is undefined and does not touch delegate', () => {
      const delegate = {
        getEntities: jest.fn(() => undefined),
      } as any;
      expect(LensScalar.queryKey([], undefined, delegate)).toBeUndefined();
      expect(LensScalar.queryKey([{}], undefined, delegate)).toBeUndefined();
      expect(delegate.getEntities).not.toHaveBeenCalled();
    });

    it('returns undefined when the Scalar table is absent', () => {
      const delegate = makeQueryDelegate({});
      expect(
        LensScalar.queryKey([{ portfolio: 'A' }], undefined, delegate),
      ).toBeUndefined();
    });

    it('returns undefined when the table is empty', () => {
      const delegate = makeQueryDelegate({ 'Scalar(portfolio-q)': {} });
      expect(
        LensScalar.queryKey([{ portfolio: 'A' }], undefined, delegate),
      ).toBeUndefined();
    });

    it('returns undefined when no cell matches the current lens', () => {
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|1|B': { pct_equity: 0.1 },
          'Company|2|C': { pct_equity: 0.2 },
        },
      });
      expect(
        LensScalar.queryKey([{ portfolio: 'A' }], undefined, delegate),
      ).toBeUndefined();
    });

    it('returns the cpk array for cells matching the current lens', () => {
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|1|A': { pct_equity: 0.5 },
          'Company|2|A': { pct_equity: 0.3 },
          'Company|1|B': { pct_equity: 0.9 },
        },
      });
      const result = LensScalar.queryKey(
        [{ portfolio: 'A' }],
        undefined,
        delegate,
      );
      expect(result).toEqual(['Company|1|A', 'Company|2|A']);
    });

    it('skips invalid (symbol / falsy) entries when enumerating', () => {
      const INVALID = Symbol('INVALID');
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|1|A': { pct_equity: 0.5 },
          'Company|2|A': INVALID,
          'Company|3|A': undefined as any,
          'Company|4|A': { pct_equity: 0.4 },
        },
      });
      const result = LensScalar.queryKey(
        [{ portfolio: 'A' }],
        undefined,
        delegate,
      );
      expect(result).toEqual(['Company|1|A', 'Company|4|A']);
    });

    it('returns cells across multiple entity types when a Scalar is shared', () => {
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|1|A': { pct_equity: 0.5 },
          'Fund|1|A': { pct_equity: 0.9 },
          'Fund|2|B': { pct_equity: 0.1 },
        },
      });
      const result = LensScalar.queryKey(
        [{ portfolio: 'A' }],
        undefined,
        delegate,
      );
      expect(result).toEqual(['Company|1|A', 'Fund|1|A']);
    });

    it('handles composite entity pks containing `|`', () => {
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|a|b|A': { pct_equity: 0.5 },
          'Company|c|d|B': { pct_equity: 0.3 },
        },
      });
      const result = LensScalar.queryKey(
        [{ portfolio: 'A' }],
        undefined,
        delegate,
      );
      expect(result).toEqual(['Company|a|b|A']);
    });

    it('over-matches when another lens ends with the current lens after `|` (documented limitation)', () => {
      // `lens` must not contain `|`. If a caller violates this, a lookup
      // for lens 'A' matches cells whose lens is 'X|A' because
      // lastIndexOf('|') picks the delimiter inside the offending lens
      // value rather than the cpk delimiter. Captured here so the behavior
      // is explicit; see the `lens` option doc.
      const delegate = makeQueryDelegate({
        'Scalar(portfolio-q)': {
          'Company|1|A': { pct_equity: 0.5 },
          'Company|2|X|A': { pct_equity: 0.3 },
        },
      });
      const result = LensScalar.queryKey(
        [{ portfolio: 'A' }],
        undefined,
        delegate,
      );
      expect(result).toEqual(['Company|1|A', 'Company|2|X|A']);
    });

    it('supports subclass overrides of queryKey', () => {
      class MyScalar extends Scalar {
        queryKey(_args: readonly any[], _unvisit: any, _delegate: any) {
          return ['custom|1|A'];
        }
      }
      const s = new MyScalar({
        lens: args => args[0]?.portfolio,
        key: 'portfolio-sub',
        entity: Company,
      });
      const delegate = makeQueryDelegate({});
      expect(s.queryKey([{ portfolio: 'A' }], undefined, delegate)).toEqual([
        'custom|1|A',
      ]);
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

  describe('field name collision with wrapper shape (regression)', () => {
    // Cell data is passed back through `Scalar.denormalize` by `unvisitEntity`
    // (which calls `schema.denormalize(entityCopy, args, unvisit)` after
    // `createIfValid`). The wrapper is an array `[id, field, entityKey]` and
    // cell data is always a plain object, so `Array.isArray` distinguishes
    // them — even when the user names a Scalar-mapped field `field`/`id`.
    class Reading extends IDEntity {
      label = '';
      field = 0;
      id_ = '';

      static key = 'Reading';
    }
    const ReadingScalar = new Scalar({
      lens: args => args[0]?.sensor,
      key: 'sensor',
      entity: Reading,
    });
    Reading.schema = {
      field: ReadingScalar,
      id_: ReadingScalar,
    } as any;

    it('round-trips when cell data has a property named `field`', () => {
      const state = normalize(
        [Reading],
        [{ id: '1', label: 'Site A', field: 42, id_: 'collision' }],
        [{ sensor: 'sensorA' }],
      );

      // Cell stores the user-defined `field` and `id_` columns verbatim.
      const cell = state.entities['Scalar(sensor)']?.['Reading|1|sensorA'];
      expect(cell).toEqual({ field: 42, id_: 'collision' });

      const memo = new SimpleMemoCache();
      const result = memo.denormalize([Reading], state.result, state.entities, [
        { sensor: 'sensorA' },
      ]) as any[];

      expect(result[0].id).toBe('1');
      expect(result[0].label).toBe('Site A');
      // Cell data `{ field: 42, ... }` is a plain object; the wrapper is an
      // array. `Array.isArray` keeps them distinct so `field` resolves to 42
      // rather than being misidentified as a wrapper and returning `undefined`.
      expect(result[0].field).toBe(42);
      expect(result[0].id_).toBe('collision');
    });
  });

  describe('lens returning undefined during normalize (regression)', () => {
    // A missing lens at normalize time is a configuration bug: the cpk would
    // collapse to `…|undefined` (literal "undefined" colliding across rows)
    // and denormalize would never find the data again. We throw rather than
    // silently corrupt the Scalar table or drop the value.
    it('throws on the entity-field path when the lens is missing', () => {
      expect(() =>
        normalize(
          [Company],
          [{ id: '1', price: 100, pct_equity: 0.5, shares: 32342 }],
          // No `portfolio` key on args → lensSelector returns undefined.
          [{}],
        ),
      ).toThrow(/lens returned undefined/);
    });

    it('throws on the Values path when the lens is missing', () => {
      expect(() =>
        normalize(
          new schema.Values(PortfolioScalar),
          { '1': { pct_equity: 0.7, shares: 555 } },
          [{}],
        ),
      ).toThrow(/lens returned undefined/);
    });
  });

  describe('denormalize passthroughs and edge cases', () => {
    const s = new Scalar({
      lens: args => args[0]?.portfolio,
      key: 'edge',
      entity: Company,
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['zero', 0],
      ['empty string', ''],
      ['false', false],
    ])(
      'returns the falsy input (%s) without further lookup',
      (_label, value) => {
        const unvisit = jest.fn();
        expect(
          s.denormalize(value, makeDelegate([{ portfolio: 'p' }], unvisit)),
        ).toBe(value);
        expect(unvisit).not.toHaveBeenCalled();
      },
    );

    // Regression: truthy non-string primitives previously fell through to
    // `delegate.unvisit`, which re-dispatched back to `Scalar.denormalize`
    // (no `pk`, string fast path misses) and stack-overflowed. This can
    // occur during schema migration when a Scalar is added to an entity
    // with cached raw numeric/boolean field values still in the store.
    it.each([
      ['positive number', 0.5],
      ['integer', 42],
      ['negative number', -1],
      ['true', true],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['bigint', 10n],
    ])(
      'returns the truthy non-string primitive input (%s) without recursion',
      (_label, value) => {
        const unvisit = jest.fn();
        expect(
          s.denormalize(value, makeDelegate([{ portfolio: 'p' }], unvisit)),
        ).toBe(value);
        expect(unvisit).not.toHaveBeenCalled();
      },
    );

    it('returns symbol inputs unchanged (suspense/INVALID propagation)', () => {
      const sym = Symbol('INVALID');
      const unvisit = jest.fn();
      expect(
        s.denormalize(sym, makeDelegate([{ portfolio: 'p' }], unvisit)),
      ).toBe(sym);
      expect(unvisit).not.toHaveBeenCalled();
    });

    it('returns plain-object inputs unchanged (cell data passthrough)', () => {
      // Cell data flows back through `Scalar.denormalize` from
      // `unvisitEntityObject` after a cpk lookup; it must pass through so the
      // wrapper-resolving branch above can index the named field.
      const cell = { pct_equity: 0.5, shares: 10 };
      const unvisit = jest.fn();
      expect(
        s.denormalize(cell, makeDelegate([{ portfolio: 'p' }], unvisit)),
      ).toBe(cell);
      expect(unvisit).not.toHaveBeenCalled();
    });

    it('returns undefined for entity-field wrapper when lens is missing at denormalize', () => {
      const wrapper: [string, string, string] = ['1', 'pct_equity', 'Company'];
      const unvisit = jest.fn();
      expect(
        s.denormalize(wrapper, makeDelegate([{}], unvisit)),
      ).toBeUndefined();
      // No lookup attempted when we cannot derive the cell key.
      expect(unvisit).not.toHaveBeenCalled();
    });

    it('returns undefined when the cell lookup yields undefined', () => {
      const wrapper: [string, string, string] = [
        'missing',
        'pct_equity',
        'Company',
      ];
      const unvisit = jest.fn(() => undefined);
      expect(
        s.denormalize(wrapper, makeDelegate([{ portfolio: 'p' }], unvisit)),
      ).toBeUndefined();
      expect(unvisit).toHaveBeenCalledWith(s, 'Company|missing|p');
    });

    it('returns undefined when the cell lookup yields a symbol (INVALID)', () => {
      const INVALID = Symbol('INVALID');
      const wrapper: [string, string, string] = ['1', 'pct_equity', 'Company'];
      const unvisit = jest.fn(() => INVALID);
      expect(
        s.denormalize(wrapper, makeDelegate([{ portfolio: 'p' }], unvisit)),
      ).toBeUndefined();
    });

    it('does not stack-overflow when an entity holds stale raw primitive values (schema migration)', () => {
      // Reproduce the real-world scenario: an entity was previously stored
      // with raw numeric scalar fields, and now its schema declares those
      // fields as a Scalar. EntityMixin.denormalize calls
      // `delegate.unvisit(Scalar, 0.5)` per field; without the primitive
      // guard, `unvisit` dispatches back into `Scalar.denormalize(0.5)`
      // (string fast path misses, `isEntity(this)` is false) and recurses
      // until the stack overflows.
      const staleState = {
        Company: {
          '1': { id: '1', price: 100, pct_equity: 0.5, shares: 32342 },
        },
      };
      const memo = new SimpleMemoCache();
      const result = memo.denormalize([Company], ['1'], staleState, [
        { portfolio: 'portfolioA' },
      ]) as any[];

      // Stale raw values pass through unchanged — no crash, no recursion.
      expect(result[0].id).toBe('1');
      expect(result[0].price).toBe(100);
      expect(result[0].pct_equity).toBe(0.5);
      expect(result[0].shares).toBe(32342);
    });

    it('looks up by cpk string and returns the cell when called via Values path', () => {
      // Recursive entry from `unvisitEntity` for string inputs (e.g. when a
      // Scalar appears as the value type in `schema.Values`). The Scalar should
      // delegate to `unvisit` so the cache layer can resolve and memoize.
      const cell = { pct_equity: 0.7 };
      const unvisit = jest.fn(() => cell);
      const out = s.denormalize(
        'Company|1|portfolioB',
        makeDelegate([{ portfolio: 'portfolioB' }], unvisit),
      );
      expect(unvisit).toHaveBeenCalledWith(s, 'Company|1|portfolioB');
      expect(out).toBe(cell);
    });
  });

  describe('Values denormalize round-trip', () => {
    it('returns cell objects keyed by entity pk', () => {
      const state = normalize(
        new schema.Values(PortfolioScalar),
        {
          '1': { pct_equity: 0.7, shares: 555 },
          '2': { pct_equity: 0.1, shares: 999 },
        },
        [{ portfolio: 'portfolioB' }],
      );

      const memo = new SimpleMemoCache();
      const result = memo.denormalize(
        new schema.Values(PortfolioScalar),
        state.result,
        state.entities,
        [{ portfolio: 'portfolioB' }],
      ) as Record<string, any>;

      expect(result['1']).toEqual({ pct_equity: 0.7, shares: 555 });
      expect(result['2']).toEqual({ pct_equity: 0.1, shares: 999 });
    });
  });

  describe('createIfValid', () => {
    it('returns a shallow copy of the input', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'cif',
      });
      const input = { pct_equity: 0.5, shares: 10 };
      const out = s.createIfValid(input);
      expect(out).toEqual(input);
      // Must not mutate or alias the original — denormalize relies on a fresh
      // object so cache writes don't leak back into the source.
      expect(out).not.toBe(input);
    });
  });

  describe('merge', () => {
    it('combines existing and incoming, with incoming winning on overlap', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'm',
      });
      expect(s.merge({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({
        a: 1,
        b: 3,
        c: 4,
      });
    });

    it('accumulates per-field writes when called repeatedly (EntityMixin loop)', () => {
      const s = new Scalar({
        lens: args => args[0]?.portfolio,
        key: 'm2',
      });
      // EntityMixin invokes Scalar once per field; the store applies `merge`
      // between the existing cell and each one-key write.
      const cell = s.merge({}, { pct_equity: 0.5 });
      const cell2 = s.merge(cell, { shares: 32342 });
      expect(cell2).toEqual({ pct_equity: 0.5, shares: 32342 });
    });
  });

  describe('shouldReorder / mergeWithStore / mergeMetaWithStore', () => {
    const s = new Scalar({
      lens: args => args[0]?.portfolio,
      key: 'reorder',
    });
    const olderMeta = { date: 1, fetchedAt: 1, expiresAt: 100 };
    const newerMeta = { date: 2, fetchedAt: 2, expiresAt: 200 };

    it('reorders only when incoming is older than existing', () => {
      // Stale (older) write should be reordered behind the newer existing.
      expect(
        s.shouldReorder(newerMeta, olderMeta, { x: 'new' }, { x: 'old' }),
      ).toBe(true);
      // Fresh (newer) write should NOT be reordered.
      expect(
        s.shouldReorder(olderMeta, newerMeta, { x: 'old' }, { x: 'new' }),
      ).toBe(false);
      // Equal timestamps: not strictly older, so do not reorder.
      expect(
        s.shouldReorder(olderMeta, olderMeta, { x: 'a' }, { x: 'b' }),
      ).toBe(false);
    });

    it('mergeWithStore: newer incoming overrides existing fields', () => {
      const result = s.mergeWithStore(
        olderMeta,
        newerMeta,
        { a: 1, b: 2 },
        { b: 3, c: 4 },
      );
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('mergeWithStore: stale incoming yields to existing on overlap', () => {
      // Reorder branch: merge(incoming, existing) so existing wins.
      const result = s.mergeWithStore(
        newerMeta,
        olderMeta,
        { a: 1, b: 2 },
        { b: 99, c: 4 },
      );
      expect(result).toEqual({ a: 1, b: 2, c: 4 });
    });

    it('mergeMetaWithStore: keeps newer meta, drops stale incoming meta', () => {
      // Newer incoming → use incomingMeta.
      expect(s.mergeMetaWithStore(olderMeta, newerMeta, {}, {})).toBe(
        newerMeta,
      );
      // Stale incoming → keep existingMeta.
      expect(s.mergeMetaWithStore(newerMeta, olderMeta, {}, {})).toBe(
        newerMeta,
      );
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

  describe('shared MemoCache across lens changes (regression)', () => {
    // Reproduces the docs scenario at docs/rest/api/Scalar.md: after both
    // portfolio A and B are loaded, switching back used to return stale
    // values. The entity-level memo had no `args` dimension, so the chain
    // recorded for the first call would replay against the original Scalar
    // cell (e.g. CellA) regardless of the current lens — re-renders with the
    // new portfolio kept returning the previously-computed entity.
    it('A → B → A on the same state and entity yields the correct lens result each time', () => {
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

      // One MemoCache shared across all denormalize calls — mirrors how the
      // controller reuses a single MemoCache across re-renders.
      const memo = new SimpleMemoCache();

      const first = memo.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioA' }],
      ) as any[];
      expect(first[0].pct_equity).toBe(0.5);
      expect(first[0].shares).toBe(32342);

      const second = memo.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioB' }],
      ) as any[];
      expect(second[0].pct_equity).toBe(0.3);
      expect(second[0].shares).toBe(323);

      // The third switch is what was "stuck" in the docs example: same
      // entities/result, just the args change back. Must return A's values.
      const third = memo.denormalize(
        [Company],
        stateB.result,
        stateB.entities,
        [{ portfolio: 'portfolioA' }],
      ) as any[];
      expect(third[0].pct_equity).toBe(0.5);
      expect(third[0].shares).toBe(32342);
    });

    it('alternating lens many times never returns the wrong cell', () => {
      const state = normalize(
        [Company],
        [
          { id: '1', price: 100, pct_equity: 0.5, shares: 32342 },
          { id: '2', price: 200, pct_equity: 0.7, shares: 1000 },
        ],
        [{ portfolio: 'portfolioA' }],
      );
      const stateB = normalize(
        [Company],
        [
          { id: '1', price: 100, pct_equity: 0.3, shares: 323 },
          { id: '2', price: 200, pct_equity: 0.4, shares: 50 },
        ],
        [{ portfolio: 'portfolioB' }],
        state,
      );

      const memo = new SimpleMemoCache();
      const lenses = ['portfolioA', 'portfolioB', 'portfolioA', 'portfolioB'];
      for (const portfolio of lenses) {
        const result = memo.denormalize(
          [Company],
          stateB.result,
          stateB.entities,
          [{ portfolio }],
        ) as any[];
        if (portfolio === 'portfolioA') {
          expect(result[0].pct_equity).toBe(0.5);
          expect(result[0].shares).toBe(32342);
          expect(result[1].pct_equity).toBe(0.7);
          expect(result[1].shares).toBe(1000);
        } else {
          expect(result[0].pct_equity).toBe(0.3);
          expect(result[0].shares).toBe(323);
          expect(result[1].pct_equity).toBe(0.4);
          expect(result[1].shares).toBe(50);
        }
      }
    });
  });
});
