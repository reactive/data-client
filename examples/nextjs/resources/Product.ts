import { Entity, createResource, schema } from '@data-client/rest';

import { Stats } from './Stats';

export class Product extends Entity {
  id = 'BTC-USD';
  base_currency = 'BTC';
  quote_currency = 'USD';
  display_name = '';
  status = 'delisted';
  trading_disabled = false;
  stats = Stats.fromJS();

  pk(): string {
    return this.id;
  }

  static key = 'Product';
  static schema = {
    stats: Stats,
  };

  static process(value: any) {
    return { ...value, stats: value.id };
  }
}

export const ProductResource = createResource({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:id',
  schema: Product,
});

interface Args {
  quote_currency?: string;
}
export const queryProduct = new schema.Query(
  new schema.All(Product),
  (entries, { quote_currency }: Args) => {
    let sorted = entries.filter(product => product.stats);
    if (quote_currency !== undefined)
      sorted = sorted.filter(
        product => product.quote_currency === quote_currency,
      );

    return sorted.sort((a, b) => {
      return b.stats.volume_30day - a.stats.volume_30day;
    });
  },
);

const example = {
  id: 'ASM-USDT',
  base_currency: 'ASM',
  quote_currency: 'USDT',
  quote_increment: '0.00001',
  base_increment: '1',
  display_name: 'ASM/USDT',
  min_market_funds: '1',
  margin_enabled: false,
  post_only: false,
  limit_only: false,
  cancel_only: false,
  status: 'delisted',
  status_message: '',
  trading_disabled: true,
  fx_stablecoin: false,
  max_slippage_percentage: '0.03000000',
  auction_mode: false,
  high_bid_limit_percentage: '',
};
