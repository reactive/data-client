import { SchemaArgs } from '@data-client/react';
import { Entity, resource, schema } from '@data-client/rest';

export class Stats extends Entity {
  product_id = '';
  open = 0;
  high = 0;
  low = 0;
  last = 0;
  volume = 0;
  volume_30day = 0;

  get volume_usd() {
    return this.volume_30day * this.last;
  }

  get gain_24() {
    return (this.last - this.open) / this.open;
  }

  pk(parent: any, key: string, args: any[]) {
    return this.product_id ?? key ?? args[0]?.product_id;
  }

  static key = 'Stats';
  static schema = {
    open: Number,
    high: Number,
    low: Number,
    volume: Number,
    volume_30day: Number,
    last: Number,
  };

  process(value: any, parent: any, key: string, args: any[]) {
    return {
      ...value,
      product_id: value.product_id ?? key ?? args[0]?.product_id,
    };
  }
}

export const StatsResource = resource({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    schema: new schema.Collection(new schema.Values(Stats)),
    process(value) {
      Object.keys(value).forEach(key => {
        value[key] = {
          ...value[key].stats_24hour,
          volume_30day: value[key].stats_30day?.volume,
        };
      });
      return value;
    },
  },
});
