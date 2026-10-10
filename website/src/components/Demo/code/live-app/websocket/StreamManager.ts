import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

/** Pushes Coinbase prices into the store over one socket
 *
 * Add reconnects and batching for production, as in
 * https://github.com/reactive/data-client/tree/master/examples/coin-app
 */
export class StreamManager implements Manager {
  declare protected socket: WebSocket;
  declare protected controller: Controller;
  /** Channel and subscriber count of each product */
  protected products = new Map<string, Product>();

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the socket pushes updates for endpoints with a channel
      if (action.type === SUBSCRIBE && 'channel' in action.endpoint) {
        const { productId } = action.args[0];
        const { channel } = action.endpoint as { channel: string };
        const product = this.products.get(productId) ?? {
          channel,
          count: 0,
        };
        this.products.set(productId, product);
        if (++product.count === 1)
          this.send('subscribe', channel, productId);
        return;
      }
      if (
        action.type === UNSUBSCRIBE &&
        'channel' in action.endpoint
      ) {
        const { productId } = action.args[0];
        const product = this.products.get(productId);
        if (product && --product.count === 0) {
          this.products.delete(productId);
          this.send('unsubscribe', product.channel, productId);
        }
        return;
      }
      return next(action);
    };
  };

  init() {
    this.socket = new WebSocket(
      'wss://ws-feed.exchange.coinbase.com',
    );
    this.socket.onopen = () => {
      for (const [productId, { channel }] of this.products)
        this.send('subscribe', channel, productId);
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
    channel: string,
    productId: string,
  ) {
    // onopen sends what was subscribed before the socket opened
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      JSON.stringify({
        type,
        product_ids: [productId],
        channels: [channel],
      }),
    );
  }
}

interface Product {
  channel: string;
  count: number;
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
