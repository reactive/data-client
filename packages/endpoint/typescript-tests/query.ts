import { useQuery } from 'packages/react/lib';

import { schema, Query, Entity } from '../src';

export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  time = new Date(0);
  open_24h = 0;

  pk(): string {
    return this.product_id;
  }

  // convert price to a float and time to a Date
  // see https://dataclient.io/rest/api/Entity#schema
  static schema = {
    price: Number,
    open_24h: Number,
    time: (iso: string) => new Date(iso),
  };
}
export class Stats extends Entity {
  product_id = '';
  open = 0;
  high = 0;
  low = 0;
  last = 0;
  volume = 0;
  volume_30day = 0;

  pk(): string {
    return this.product_id;
  }
}

const queryPrice = new Query(
  { ticker: Ticker, stats: Stats },
  ({ ticker, stats }) => ticker?.price ?? stats?.last,
);
const queryPrice2 = new Query(
  new schema.Object({ ticker: Ticker, stats: Stats }),
  ({ ticker, stats }) => ticker?.price ?? stats?.last,
);

function useTest() {
  const price = useQuery(queryPrice, { product_id: 5 });
  // @ts-expect-error
  useQuery(queryPrice);
  // @ts-expect-error
  useQuery(queryPrice, { product_id2: 5 });
  // @ts-expect-error
  useQuery(queryPrice, { product_id: 5 }, { product_id: 5 });
}

function useTest2() {
  const price = useQuery(queryPrice2, { product_id: 5 });
  // @ts-expect-error
  useQuery(queryPrice2);
  // @ts-expect-error
  useQuery(queryPrice2, { product_id2: 5 });
  // @ts-expect-error
  useQuery(queryPrice2, { product_id: 5 }, { product_id: 5 });
}
