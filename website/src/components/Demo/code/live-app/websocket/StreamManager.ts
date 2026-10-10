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
  /** Channel of each product useLive() subscribed to */
  protected products = new Map<string, string>();

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the socket pushes updates for endpoints with a channel
      if (action.type === SUBSCRIBE && 'channel' in action.endpoint) {
        const { productId } = action.args[0];
        const { channel } = action.endpoint as { channel: string };
        this.products.set(productId, channel);
        return this.send('subscribe', channel, productId);
      }
      if (
        action.type === UNSUBSCRIBE &&
        'channel' in action.endpoint
      ) {
        const { productId } = action.args[0];
        const { channel } = action.endpoint as { channel: string };
        this.products.delete(productId);
        return this.send('unsubscribe', channel, productId);
      }
      return next(action);
    };
  };

  init() {
    this.socket = new WebSocket(
      'wss://ws-feed.exchange.coinbase.com',
    );
    this.socket.onopen = () => {
      for (const [productId, channel] of this.products)
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

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
