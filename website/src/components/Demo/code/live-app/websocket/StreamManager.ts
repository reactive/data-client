import type {
  Controller,
  Manager,
  Middleware,
} from '@data-client/react';
import { actionTypes, getDefaultManagers } from '@data-client/react';
import { ReconnectingSocket } from './socket';
import { Ticker } from './resources';

const { SUBSCRIBE, UNSUBSCRIBE } = actionTypes;

interface Product {
  channel: string;
  count: number;
}

/** Pushes Coinbase prices into the store over one socket */
export class StreamManager implements Manager {
  protected socket = new ReconnectingSocket(
    'wss://ws-feed.exchange.coinbase.com',
  );
  declare protected controller: Controller;
  /** Channel and component count of each subscribed product */
  protected products = new Map<string, Product>();

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      // the socket pushes updates for endpoints with a channel
      if (
        (action.type === SUBSCRIBE || action.type === UNSUBSCRIBE) &&
        'channel' in action.endpoint
      ) {
        const { productId } = action.args[0];
        const { channel } = action.endpoint as { channel: string };
        if (action.type === SUBSCRIBE)
          this.subscribe(productId, channel);
        else this.unsubscribe(productId);
        return;
      }
      return next(action);
    };
  };

  /** Shares one socket subscription among a product's components */
  protected subscribe(productId: string, channel: string) {
    const product = this.products.get(productId) ?? {
      channel,
      count: 0,
    };
    this.products.set(productId, product);
    if (++product.count === 1)
      this.send('subscribe', channel, productId);
  }

  protected unsubscribe(productId: string) {
    const product = this.products.get(productId);
    if (product && --product.count === 0) {
      this.products.delete(productId);
      this.send('unsubscribe', product.channel, productId);
    }
  }

  init() {
    this.socket.onopen = () => {
      // a new socket has no subscriptions yet
      for (const [productId, { channel }] of this.products)
        this.send('subscribe', channel, productId);
    };
    this.socket.onmessage = ({ type, product_id, price, time }) => {
      if (type !== 'ticker') return;
      this.controller.set(
        Ticker,
        { product_id },
        { product_id, price, time },
      );
    };
    // without subscriptions, quiet is expected
    this.socket.expectsMessages = () => this.products.size > 0;
    this.socket.open();
  }

  cleanup() {
    this.socket.close();
  }

  protected send(
    type: 'subscribe' | 'unsubscribe',
    channel: string,
    productId: string,
  ) {
    this.socket.send({
      type,
      product_ids: [productId],
      channels: [channel],
    });
  }
}

// passed to <DataProvider managers={getManagers()}>
export default function getManagers() {
  return [new StreamManager(), ...getDefaultManagers()];
}
