import { RestEndpoint } from '@data-client/rest';

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
});
const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
});

const companiesByPortfolio: Record<
  string,
  {
    id: string;
    name: string;
    price: number;
    pct_equity: number;
    shares: number;
  }[]
> = {
  A: [
    {
      id: '1',
      name: 'Acme Corp',
      price: 145.2,
      pct_equity: 0.5,
      shares: 10000,
    },
    { id: '2', name: 'Globex', price: 89.5, pct_equity: 0.2, shares: 4000 },
    { id: '3', name: 'Initech', price: 32.1, pct_equity: 0.1, shares: 2500 },
  ],
  B: [
    { id: '1', name: 'Acme Corp', price: 145.2, pct_equity: 0.3, shares: 6000 },
    { id: '2', name: 'Globex', price: 89.5, pct_equity: 0.4, shares: 8000 },
    { id: '3', name: 'Initech', price: 32.1, pct_equity: 0.05, shares: 1200 },
  ],
};

export const companyFixtures = [
  {
    endpoint: getCompanies,
    response({ portfolio }: { portfolio: string }) {
      return companiesByPortfolio[portfolio] ?? [];
    },
    delay: 150,
  },
  {
    endpoint: getPortfolioColumns,
    response({ portfolio }: { portfolio: string }) {
      return (companiesByPortfolio[portfolio] ?? []).map(
        ({ id, pct_equity, shares }) => ({ id, pct_equity, shares }),
      );
    },
    delay: 150,
  },
];
