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
  getDefaultManagers,
  DevToolsManager,
  NetworkManager,
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
          ...getManagers(),
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

function getManagers() {
  const managers = getDefaultManagers().filter(
    manager => manager.constructor.name !== 'DevToolsManager',
  );
  if (process.env.NODE_ENV !== 'production') {
    const networkManager: NetworkManager | undefined = managers.find(
      manager => manager instanceof NetworkManager,
    ) as any;
    managers.unshift(
      new DevToolsManager(
        {
          // double latency to help with high frequency updates
          latency: 1000,
          // don't use replacer because it is way too slow for our fast updating
          serialize: {
            options: undefined,
          },
        },
        networkManager?.skipLogging?.bind?.(networkManager),
      ),
    );
  }
  return managers;
}

export default floodSpouts(spouts);
