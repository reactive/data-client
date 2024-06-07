import { Entity, createResource, schema } from '@data-client/rest';

import { iconTable } from './cryptoIconTable';
import { Stats } from './Stats';

export class Currency extends Entity {
  id = '';
  name = '';
  min_size = '1';
  status = 'online';
  message = '';
  convertable_to = [];
  details = {
    type: 'crypto',
    symbol: 'Ξ',
    network_confirmations: 14,
    sort_order: 67,
    crypto_address_link:
      'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca?a={{address}}',
    crypto_transaction_link: 'https://etherscan.io/tx/0x{{txId}}',
    push_payment_methods: ['crypto'],
    group_types: [],
    display_name: null,
    processing_time_seconds: null,
    min_withdrawal_amount: 0.01,
    max_withdrawal_amount: 579800,
  };

  default_network = 'ethereum';
  supported_networks = [];

  // faked for client-side join
  stats = Stats.fromJS();

  get icon() {
    return iconTable[this.id]?.img_url;
  }

  pk(): string {
    return this.id;
  }

  static key = 'Currency';

  static process(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ) {
    // enables client-side join with stats
    return { ...input, stats: `${input.id}-USD` };
  }

  static schema = {
    stats: Stats,
  };
}

export const CurrencyResource = createResource({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/currencies/:id',
  schema: Currency,
});

interface Args {
  type?: string;
}
export const queryCurrency = new schema.Query(
  new schema.All(Currency),
  (entries, { type = 'crypto' }: Args = {}) => {
    let sorted = entries.filter(
      currency =>
        currency.details.type === type && currency.status === 'online',
    );
    /*if (quote_currency !== undefined)
      sorted = sorted.filter(
        (product) => product.quote_currency === quote_currency,
      );*/

    sorted = sorted.sort((a, b) => {
      return b?.stats?.volume_usd - a?.stats?.volume_usd;
    });
    return sorted;
  },
);

const example = {
  id: 'LINK',
  name: 'Chainlink',
  min_size: '1',
  status: 'online',
  message: '',
  max_precision: '0.00000001',
  convertible_to: [],
  details: {
    type: 'crypto',
    symbol: 'Ξ',
    network_confirmations: 14,
    sort_order: 67,
    crypto_address_link:
      'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca?a={{address}}',
    crypto_transaction_link: 'https://etherscan.io/tx/0x{{txId}}',
    push_payment_methods: ['crypto'],
    group_types: [],
    display_name: null,
    processing_time_seconds: null,
    min_withdrawal_amount: 0.01,
    max_withdrawal_amount: 579800,
  },
  default_network: 'ethereum',
  supported_networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      status: 'online',
      contract_address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      crypto_address_link:
        'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca?a={{address}}',
      crypto_transaction_link: 'https://etherscan.io/tx/0x{{txId}}',
      min_withdrawal_amount: 0.01,
      max_withdrawal_amount: 579800,
      network_confirmations: 14,
      processing_time_seconds: null,
    },
  ],
};
