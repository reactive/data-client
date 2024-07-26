import { schema } from '@data-client/rest';

import { Stats } from './Stats';
import { Ticker } from './Ticker';

/** Computes price; falling back to stats data
 * Stats can be bulk-fetched which makes it good for list views
 */
export const queryPrice = new schema.Query(
  { ticker: Ticker, stats: Stats },
  ({ ticker, stats }) => ticker?.price ?? stats?.last,
);

/** Computes 24 hour gain; falling back to stats data
 * Stats can be bulk-fetched which makes it good for list views
 */
export const queryGain24 = new schema.Query(
  { ticker: Ticker, stats: Stats },
  ({ ticker, stats }) => {
    return ticker?.gain_24 ?? stats?.gain_24 ?? 0;
  },
);
