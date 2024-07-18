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
  actionTypes,
} from '@data-client/react';
import StreamManager from 'resources/StreamManager';
import { Ticker } from 'resources/Ticker';

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
            () => new WebSocket('wss://ws-feed.exchange.coinbase.com'),
            { ticker: Ticker },
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
          // skip websocket updates as these are too spammy
          predicate: (state, action) =>
            action.type !== actionTypes.SET_TYPE || action.schema !== Ticker,
        },
        networkManager && (action => networkManager.skipLogging(action)),
      ),
    );
  }
  return managers;
}

export default floodSpouts(spouts);
