import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = 0;
  time = Temporal.Instant.fromEpochMilliseconds(0);
  volume = '';

  pk() {
    return this.product_id;
  }

  static key = 'Ticker';

  static schema = {
    price: Number,
    size: Number,
    time: Temporal.Instant.from,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // in miliseconds
  pollFrequency: 2000,
  process(value, { productId }) {
    value.product_id = productId;
    return value;
  },
});
