import {
  actionTypes,
  getDefaultManagers,
  type Controller,
  type Manager,
  type Middleware,
} from '@data-client/react';
import { Ticker } from './resources';

/** Writes prices pushed by Server-Sent Events into the store */
export class StreamManager implements Manager {
  declare protected source?: EventSource;
  declare protected controller: Controller;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the stream pushes every Ticker: nothing to poll
      if (
        (action.type === actionTypes.SUBSCRIBE ||
          action.type === actionTypes.UNSUBSCRIBE) &&
        action.endpoint.schema === Ticker
      )
        return;
      return next(action);
    };
  };

  // streams only while the page is visible
  init() {
    document.addEventListener('visibilitychange', this.connect);
    this.connect();
  }

  connect = () => {
    this.source?.close();
    if (document.hidden) return;
    // the products AssetList shows
    this.source = new EventSource(
      '/api/ticker-stream?product_ids=BTC-USD,ETH-USD,DOGE-USD',
    );
    // every 5 seconds: the Tickers that changed
    this.source.onmessage = event => {
      this.controller.set([Ticker], JSON.parse(event.data));
    };
  };

  cleanup() {
    document.removeEventListener('visibilitychange', this.connect);
    this.source?.close();
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
