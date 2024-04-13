import { RestEndpoint } from '@data-client/rest';

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
