import { Entity, createResource, schema } from '@data-client/rest';

export class Stats extends Entity {
  id = '';
  open = '0.15';
  high = 0;
  low = 0;
  last = 0;
  volume = 0;
  volume_30day = 0;

  get volume_usd() {
    return this.volume_30day * this.last;
  }

  pk(parent: any, key: string, args: any[]) {
    return this.id ?? key ?? args[0]?.id;
  }

  static key = 'Stats';
  static schema = {
    high: Number,
    low: Number,
    volume: Number,
    volume_30day: Number,
    last: Number,
  };

  process(value: any, parent: any, key: string, args: any[]) {
    return { ...value, id: value.id ?? key ?? args[0]?.id };
  }
}

export const StatsResource = createResource({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:id/stats',
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
