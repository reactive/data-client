import { Entity, schema } from '@rest-hooks/rest';
import { RestEndpoint } from '@rest-hooks/rest/next';

export class ExchangeRates extends Entity {
  currency = 'USD';
  rates: Record<string, number> = {};

  pk(): string {
    return this.currency;
  }

  static schema = {
    rates: new schema.Values(FloatSerializer),
  };
}

export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  // in ms; this api does not update the value at a faster rate
  pollFrequency: 15000,
});
