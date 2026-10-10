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
  declare protected connecting?: ReturnType<typeof setTimeout>;
  protected productIds = new Set<string>();

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      if (
        action.type === actionTypes.SUBSCRIBE &&
        action.endpoint.schema === Ticker
      ) {
        // stream what useLive() subscribes to, instead of polling it
        this.productIds.add(action.args[0].productId);
        this.connecting ??= setTimeout(this.connect);
        return;
      }
      if (
        action.type === actionTypes.UNSUBSCRIBE &&
        action.endpoint.schema === Ticker
      )
        return;
      return next(action);
    };
  };

  // streams only while the page is visible
  init() {
    document.addEventListener('visibilitychange', this.connect);
  }

  connect = () => {
    this.connecting = undefined;
    this.source?.close();
    if (document.hidden || !this.productIds.size) return;
    this.source = new EventSource(
      `/api/ticker-stream?product_ids=${[...this.productIds].join(',')}`,
    );
    // every 5 seconds: the Tickers that changed
    this.source.onmessage = event => {
      this.controller.set([Ticker], JSON.parse(event.data));
    };
  };

  cleanup() {
    document.removeEventListener('visibilitychange', this.connect);
    clearTimeout(this.connecting);
    this.source?.close();
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
