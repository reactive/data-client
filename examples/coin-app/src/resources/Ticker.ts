import { Entity, RestEndpoint } from '@data-client/rest';
import type { FixtureEndpoint } from '@data-client/test';

// Visit https://dataclient.io/rest to read more about these definitions
export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = '0';
  time = new Date(0);
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
    if (args[0].product_id) {
      value.product_id = args[0].product_id;
    }
    return value;
  }
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
  channel: 'ticker_batch',
});

export let TickerFixtures: Record<string, FixtureEndpoint> = {};

// we don't want our mocks ending up in our production builds
if (process.env.NODE_ENV !== 'production') {
  TickerFixtures = {
    list: {
      endpoint: getTicker,
      args: [
        {
          productId: 'BTC-USD',
        },
      ],
      response: {
        ask: '26035.14',
        bid: '26035.13',
        volume: '9948.18263564',
        trade_id: 557935313,
        price: '26035.14',
        size: '0.00947072',
        time: '2023-08-24T21:02:36.896714Z',
      },
    },
  };
}
