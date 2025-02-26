import { Entity, resource, RestEndpoint, schema } from '@data-client/rest';

// docs: https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
export const getCandles = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/candles',
  searchParams: {} as {
    granularity?: 60 | 300 | 900 | 3600 | 21600 | 86400;
    start?: string | number;
    end?: string | number;
  },
  process(value: CandleTuple[]) {
    return value.map(candle => ({
      timestamp: candle[0],
      price_open: candle[3],
    }));
  },
  pollFrequency: 60 * 1000,
});

type CandleTuple = [
  timestamp: number,
  price_low: number,
  price_high: number,
  price_open: number,
  price_close: number,
];
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  website = '';
  todos: Todo[] = [];

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static schema = {
    todos: new schema.Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});
