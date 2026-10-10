import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { ReconnectingEventSource } from './source';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

/** Writes prices pushed by Server-Sent Events into the store */
export class StreamManager implements Manager {
  // the products AssetList shows
  protected source = new ReconnectingEventSource(
    '/api/ticker-stream?product_ids=BTC-USD,ETH-USD,DOGE-USD',
  );
  declare protected controller: Controller;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the stream pushes updates for endpoints with a channel
      if (
        (action.type === SUBSCRIBE || action.type === UNSUBSCRIBE) &&
        'channel' in action.endpoint
      )
        return;
      return next(action);
    };
  };

  init() {
    // every 5 seconds: the Tickers that changed
    this.source.onmessage = tickers => {
      if (tickers.length) this.controller.set([Ticker], tickers);
    };
    this.source.open();
  }

  cleanup() {
    this.source.close();
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
