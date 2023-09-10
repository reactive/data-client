import {
  floodSpouts,
  documentSpout,
  dataClientSpout,
  routerSpout,
  JSONSpout,
  appSpout,
} from '@anansi/core';
import {
  useController,
  AsyncBoundary,
  CacheProvider,
  getDefaultManagers,
} from '@data-client/react';

import StreamManager from 'resources/StreamManager';
import { getTicker } from 'resources/Ticker';

import App from './App';
import { createRouter } from './routing';

const app = (
  <AsyncBoundary>
    <App />
  </AsyncBoundary>
);

const spouts = JSONSpout()(
  documentSpout({ title: 'Coin App' })(
    dataClientSpout({
      getManagers: () => {
        return [
          new StreamManager(
            new WebSocket('wss://ws-feed.exchange.coinbase.com'),
            { ticker: getTicker },
          ),
          ...getDefaultManagers(),
        ];
      },
    })(
      routerSpout({
        useResolveWith: useController,
        createRouter,
      })(appSpout(app)),
    ),
  ),
);

export default floodSpouts(spouts);
