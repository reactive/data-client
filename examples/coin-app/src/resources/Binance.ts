import { RestEndpoint, Entity } from '@data-client/rest';

export class BinanceTicker24hr extends Entity {
  symbol = '';
  priceChange = '';
  priceChangePercent = '';
  weightedAvgPrice = '';
  prevClosePrice = '';
  lastPrice = '';
  lastQty = '';
  bidPrice = '';
  bidQty = '';
  askPrice = '';
  askQty = '';
  openPrice = '';
  highPrice = '';
  lowPrice = '';
  volume = '';
  quoteVolume = '';
  openTime = 0;
  closeTime = 0;
  firstId = 0;
  lastId = 0;
  count = 0;
  static key = 'BinanceTicker24hr';
}

export class BinanceKline extends Entity {
  openTime = 0;
  open = '';
  high = '';
  low = '';
  close = '';
  volume = '';
  closeTime = 0;
  quoteAssetVolume = '';
  numberOfTrades = 0;
  takerBuyBaseAssetVolume = '';
  takerBuyQuoteAssetVolume = '';
  static key = 'BinanceKline';
}

export class BinanceTrade extends Entity {
  id = 0;
  price = '';
  qty = '';
  quoteQty = '';
  time = 0;
  isBuyerMaker = false;
  isBestMatch = false;
  static key = 'BinanceTrade';
}

/**
 * Get 24hr ticker price change statistics for a symbol or symbols
 * GET /api/v3/ticker/24hr
 * Example: /api/v3/ticker/24hr?symbol=BTCUSDT
 */
export const getBinanceTicker24hr = new RestEndpoint({
  urlPrefix: 'https://api.binance.com',
  path: '/api/v3/ticker/24hr',
  searchParams: {} as {
    symbol?: string;
  },
  schema: [BinanceTicker24hr],
  pollFrequency: 60 * 1000, // poll every minute
});

/**
 * Get Kline/candlestick data for a symbol
 * GET /api/v3/klines
 * Example: /api/v3/klines?symbol=BTCUSDT&interval=1m
 */
export const getBinanceKlines = new RestEndpoint({
  urlPrefix: 'https://api.binance.com',
  path: '/api/v3/klines',
  searchParams: {} as {
    symbol: string;
    interval: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  },
  schema: [BinanceKline],
  pollFrequency: 60 * 1000, // poll every minute
  process(value: any[][]) {
    return value.map(kline => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10],
    }));
  },
});

/**
 * Get recent trades for a symbol
 * GET /api/v3/trades
 * Example: /api/v3/trades?symbol=BTCUSDT&limit=10
 * https://binance-docs.github.io/apidocs/spot/en/#recent-trades-list
 */
export const getBinanceRecentTrades = new RestEndpoint({
  urlPrefix: 'https://api.binance.com',
  path: '/api/v3/trades',
  searchParams: {} as {
    symbol: string;
    limit?: number;
  },
  schema: [BinanceTrade],
  pollFrequency: 60 * 1000, // poll every minute
});
