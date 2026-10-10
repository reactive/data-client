import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

interface Product {
  channel: string;
  count: number;
}

/** Pushes Coinbase prices into the store over one socket,
 * reconnecting when it drops or the browser comes back online
 */
export class StreamManager implements Manager {
  declare protected socket: WebSocket;
  declare protected controller: Controller;
  /** Channel and subscriber count of each product */
  protected products = new Map<string, Product>();
  protected attempts = 0;
  declare protected retry: ReturnType<typeof setTimeout>;

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
    this.connect();
    addEventListener('online', this.reconnect);
    addEventListener('offline', this.disconnect);
  }

  cleanup() {
    removeEventListener('online', this.reconnect);
    removeEventListener('offline', this.disconnect);
    clearTimeout(this.retry);
    this.disconnect();
  }

  protected connect() {
    this.socket = new WebSocket(
      'wss://ws-feed.exchange.coinbase.com',
    );
    this.socket.onopen = () => {
      this.attempts = 0;
      // a new socket has no subscriptions yet
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
    // fires after errors too; offline waits for 'online' instead
    this.socket.onclose = () => {
      if (!navigator.onLine) return;
      const delay = Math.min(30_000, 1000 * 2 ** this.attempts++);
      this.retry = setTimeout(this.reconnect, delay);
    };
  }

  /** Back online, or the retry timer fired */
  protected reconnect = () => {
    clearTimeout(this.retry);
    // CLOSING: disconnect() stopped waiting for it
    if (this.socket.readyState >= WebSocket.CLOSING) this.connect();
  };

  /** Offline, a socket can take minutes to notice and can't finish
   * closing, so stop waiting for its onclose */
  protected disconnect = () => {
    this.socket.onclose = null;
    this.socket.close();
  };

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

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
