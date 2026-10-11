import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { ReconnectingEventSource } from './eventSource';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

/** Writes prices pushed by Server-Sent Events into the store */
export class StreamManager implements Manager {
  protected source = new ReconnectingEventSource();
  declare protected controller: Controller;
  /** How many components subscribe to each product */
  protected products = new Map<string, number>();
  declare protected pending: ReturnType<typeof setTimeout>;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the stream pushes updates for endpoints with a channel
      if (
        (action.type === SUBSCRIBE || action.type === UNSUBSCRIBE) &&
        'channel' in action.endpoint
      ) {
        const { productId } = action.args[0];
        const count =
          (this.products.get(productId) ?? 0) +
          (action.type === SUBSCRIBE ? 1 : -1);
        if (count > 0) this.products.set(productId, count);
        else this.products.delete(productId);
        // one new stream for a burst of changes, like a list rendering
        clearTimeout(this.pending);
        this.pending = setTimeout(this.stream, 100);
        return;
      }
      return next(action);
    };
  };

  /** An open stream can't add products, so this replaces it */
  protected stream = () => {
    const productIds = [...this.products.keys()].sort().join(',');
    this.source.setUrl(
      productIds
        ? `/api/ticker-stream?product_ids=${productIds}`
        : undefined,
    );
  };

  init() {
    // every 5 seconds: the Tickers that changed
    this.source.onmessage = tickers => {
      if (tickers.length) this.controller.set([Ticker], tickers);
    };
    this.source.open();
  }

  // a pending stream() still records the products for the next init()
  cleanup() {
    this.source.close();
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
