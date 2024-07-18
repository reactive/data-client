import { Entity, RestEndpoint } from '@data-client/rest';

// Visit https://dataclient.io/docs/getting-started/resource to read more about these definitions
export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  time = new Date(0);
  // last_size = '0';
  // best_bid = '0';
  // best_ask = '0';
  // volume_24h = '';
  // volume_30d = '';
  open_24h = 0;

  pk(): string {
    return this.product_id;
  }

  // implementing `key` makes us robust against class name mangling
  static key = 'ticker';

  // convert price to a float and time to a Date
  // see https://dataclient.io/rest/api/Entity#schema
  static schema = {
    price: Number,
    open_24h: Number,
    time: (iso: string) => new Date(iso),
  };

  // Use server timings to ensure zero race conditions
  static shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: { time: Date },
    incoming: { time: Date },
  ) {
    return existing.time > incoming.time;
  }

  static process(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ): any {
    const value = { ...input };
    // sometimes product_id is not included in the API response
    if (args[0].product_id) {
      value.product_id = args[0].product_id;
    }
    // fallback to current price to show no gain if we don't have 24 hour
    if (!value.open_24h) value.open_24h = value.price;
    return value;
  }
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
  channel: 'ticker',
  pollFrequency: 2000,
});
