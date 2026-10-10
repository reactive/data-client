import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

/** Pushes Coinbase prices into the store over one socket */
export class StreamManager implements Manager {
  declare protected socket: WebSocket;
  declare protected controller: Controller;
  /** Products useLive() subscribed to */
  protected products = new Set<string>();

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      if (
        (action.type !== SUBSCRIBE && action.type !== UNSUBSCRIBE) ||
        !('channel' in action.endpoint)
      )
        return next(action);
      // the socket pushes this endpoint's updates, so nothing polls
      const { productId } = action.args[0];
      if (action.type === SUBSCRIBE) {
        this.products.add(productId);
        this.send('subscribe', [productId]);
      } else {
        this.products.delete(productId);
        this.send('unsubscribe', [productId]);
      }
    };
  };

  init() {
    this.socket = new WebSocket(
      'wss://ws-feed.exchange.coinbase.com',
    );
    this.socket.onopen = () => {
      if (this.products.size)
        this.send('subscribe', [...this.products]);
    };
    this.socket.onmessage = event => {
      const { type, product_id, price, time } = JSON.parse(
        event.data,
      );
      if (type !== 'ticker') return;
      this.controller.set(
        Ticker,
        { product_id },
        { product_id, price, time },
      );
    };
  }

  cleanup() {
    this.socket.close();
  }

  protected send(
    type: 'subscribe' | 'unsubscribe',
    product_ids: string[],
  ) {
    // onopen sends what was subscribed before the socket opened
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      JSON.stringify({
        type,
        product_ids,
        channels: ['ticker_batch'],
      }),
    );
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
