import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from '@js-temporal/polyfill';

// Visit https://dataclient.io/docs/guides/resource-types to read more about these definitions
export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = '0';
  time = Temporal.Instant.fromEpochSeconds(0);
  bid = '0';
  ask = '0';
  volume = '';

  pk(): string {
    return this.product_id;
  }
  // implementing `key` makes us robust against class name mangling
  static key = 'Ticker';

  // convert price to a float and time to a Date
  // see https://dataclient.io/rest/api/Entity#schema
  static schema = {
    price: Number,
    time: Temporal.Instant.from,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  pollFrequency: 2000,
  process(value, { productId }) {
    value.product_id = productId;
    return value;
  }
});
