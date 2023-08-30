import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  trade_id = 0;
  price = 0;
  size = '0';
  time = new Date(0);
  bid = '0';
  ask = '0';
  volume = '';

  pk(): string {
    return `${this.trade_id}`;
  }

  static key = 'Ticker';

  static schema = {
    price: Number,
    time: Date,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // in miliseconds
  pollFrequency: 2000,
});
