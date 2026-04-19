import { Entity, RestEndpoint, Scalar, schema } from '@data-client/rest';
import { jest } from '@jest/globals';
import React from 'react';

import { renderDataHook } from '../../../../test';
import useFetch from '../useFetch';
import useSuspense from '../useSuspense';

class Company extends Entity {
  id = '';
  name = '';
  price = 0;
  pct_equity = 0;
  shares = 0;
}
const PortfolioScalar = new Scalar({
  lens: args => (args[0] as { portfolio: string })?.portfolio,
  key: 'portfolio',
  entity: Company,
});
Company.schema = {
  pct_equity: PortfolioScalar,
  shares: PortfolioScalar,
} as any;

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: [Company],
});

const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new schema.Values(PortfolioScalar),
});

const portfolioRows: Record<string, any[]> = {
  A: [
    {
      id: '1',
      name: 'Acme Corp',
      price: 145.2,
      pct_equity: 0.5,
      shares: 10000,
    },
    { id: '2', name: 'Globex', price: 89.5, pct_equity: 0.2, shares: 4000 },
  ],
  B: [
    { id: '1', name: 'Acme Corp', price: 145.2, pct_equity: 0.3, shares: 6000 },
    { id: '2', name: 'Globex', price: 89.5, pct_equity: 0.4, shares: 8000 },
  ],
};
const portfolioColumns: Record<string, Record<string, any>> = {
  A: {
    '1': { pct_equity: 0.5, shares: 10000 },
    '2': { pct_equity: 0.2, shares: 4000 },
  },
  B: {
    '1': { pct_equity: 0.3, shares: 6000 },
    '2': { pct_equity: 0.4, shares: 8000 },
  },
};

describe('Scalar lens — useSuspense across portfolio switches (regression)', () => {
  // Mirrors the docs scenario at docs/rest/api/Scalar.md: with both
  // `useSuspense(getCompanies)` and `useFetch(getPortfolioColumns)` running,
  // toggling the portfolio (A → B → A → B) used to "stick" on the third
  // switch because the entity-level memo cached `Company` per (entity ref)
  // and replayed the original Scalar cell regardless of current args.
  it('updates pct_equity/shares correctly on every portfolio change', async () => {
    const { result, rerender, waitForNextUpdate } = renderDataHook(
      ({ portfolio }: { portfolio: 'A' | 'B' }) => {
        const companies = useSuspense(getCompanies, { portfolio });
        useFetch(getPortfolioColumns, { portfolio });
        return companies;
      },
      {
        initialProps: { portfolio: 'A' as 'A' | 'B' },
        resolverFixtures: [
          {
            endpoint: getCompanies,
            response: ({ portfolio }) => portfolioRows[portfolio],
          },
          {
            endpoint: getPortfolioColumns,
            response: ({ portfolio }) => portfolioColumns[portfolio],
          },
        ],
      },
    );

    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current[0].pct_equity).toBe(0.5);
    expect(result.current[0].shares).toBe(10000);
    expect(result.current[1].pct_equity).toBe(0.2);

    rerender({ portfolio: 'B' });
    await waitForNextUpdate();
    expect(result.current[0].pct_equity).toBe(0.3);
    expect(result.current[0].shares).toBe(6000);
    expect(result.current[1].pct_equity).toBe(0.4);

    // Third switch — the response is already in cache. Without the lensKey
    // bucket, the entity memo returns the previously-computed Company-with-B
    // even though args are now portfolio:'A'.
    rerender({ portfolio: 'A' });
    // No suspense expected — data is cached. Give React a tick to re-render.
    await new Promise(r => setTimeout(r, 0));
    expect(result.current[0].pct_equity).toBe(0.5);
    expect(result.current[0].shares).toBe(10000);
    expect(result.current[1].pct_equity).toBe(0.2);

    rerender({ portfolio: 'B' });
    await new Promise(r => setTimeout(r, 0));
    expect(result.current[0].pct_equity).toBe(0.3);
    expect(result.current[0].shares).toBe(6000);
    expect(result.current[1].pct_equity).toBe(0.4);
  });
});
