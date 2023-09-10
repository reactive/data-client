import {
  laySpouts,
  documentSpout,
  dataClientSpout,
  prefetchSpout,
  routerSpout,
  JSONSpout,
  appSpout,
} from '@anansi/core/server';
import { useController, AsyncBoundary } from '@data-client/react';

import App from './App';
import { createRouter } from './routing';

const app = (
  <AsyncBoundary>
    <App />
  </AsyncBoundary>
);

const csPolicy = {
  'base-uri': "'self'",
  'object-src': "'none'",
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'unsafe-inline'", "'self'"],
};

const spouts = prefetchSpout('controller')(
  documentSpout({
    title: 'Coin App',
    csPolicy,
  })(
    JSONSpout()(
      dataClientSpout()(
        routerSpout({ useResolveWith: useController, createRouter })(
          appSpout(app),
        ),
      ),
    ),
  ),
);

export default laySpouts(spouts);
