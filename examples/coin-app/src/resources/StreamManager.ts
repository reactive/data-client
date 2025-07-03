import type { Manager, Middleware, ActionTypes } from '@data-client/react';
import { Controller, actionTypes } from '@data-client/react';
import type { Entity } from '@data-client/rest';

/** Updates crypto data using Coinbase websocket stream
 *
 * https://docs.cloud.coinbase.com/advanced-trade-api/docs/ws-overview
 */
export default class StreamManager implements Manager {
  declare protected evtSource: WebSocket; // | EventSource;
  declare protected createEventSource: () => WebSocket; // | EventSource;
  declare protected entities: Record<string, typeof Entity>;
  protected msgQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] =
    [];

  protected product_ids: string[] = [];
  private attempts = 0;
  declare protected controller: Controller;

  constructor(
    evtSource: () => WebSocket, // | EventSource,
    entities: Record<string, typeof Entity>,
  ) {
    this.entities = entities;
    this.createEventSource = evtSource;
  }

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => {
      switch (action.type) {
        case actionTypes.SUBSCRIBE:
          // only process registered endpoints
          if (
            !Object.values(this.entities).find(
              // @ts-expect-error
              entity => entity.key === action.endpoint.schema?.key,
            )
          )
            break;
          if ('channel' in action.endpoint) {
            this.subscribe(action.args[0]?.product_id);
            // consume subscription if we use it
            return Promise.resolve();
          }

          return next(action);
        case actionTypes.UNSUBSCRIBE:
          // only process registered endpoints
          if (
            !Object.values(this.entities).find(
              // @ts-expect-error
              entity => entity.key === action.endpoint.schema?.key,
            )
          )
            break;
          if ('channel' in action.endpoint) {
            this.send(
              JSON.stringify({
                type: 'unsubscribe',
                product_ids: [action.args[0]?.product_id],
                channels: [action.endpoint.channel],
              }),
            );
            return Promise.resolve();
          }
          return next(action);
        default:
          return next(action);
      }
    };
  };

  connect = () => {
    this.evtSource = this.createEventSource();
    this.evtSource.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(this.controller, msg);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    this.evtSource.onopen = () => {
      console.info('WebSocket connected');
      // Reset reconnection attempts after a successful connection
      this.attempts = 0;
    };
    this.evtSource.onclose = () => {
      console.info('WebSocket disconnected');
      this.reconnect();
    };
    this.evtSource.onerror = error => {
      console.error('WebSocket error:', error);
      // Ensures that the onclose handler gets triggered for reconnection
      this.evtSource.close();
    };
  };

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.evtSource.readyState === this.evtSource.OPEN) {
      this.evtSource.send(data);
    } else {
      this.msgQueue.push(data);
    }
  }

  subscribe(product_id: string) {
    if (this.evtSource.readyState === this.evtSource.OPEN) {
      this.product_ids.push(product_id);
      setTimeout(() => this.flushSubscribe(), 5);
    } else {
      this.product_ids.push(product_id);
    }
  }

  flushSubscribe() {
    if (this.product_ids.length)
      this.send(
        JSON.stringify({
          type: 'subscribe',
          product_ids: this.product_ids,
          channels: ['ticker'],
        }),
      );
    this.product_ids = [];
  }

  /** Every websocket message is sent here
   *
   * @param controller
   * @param msg JSON parsed message
   */
  handleMessage(ctrl: Controller, msg: any) {
    if (msg.type in this.entities) {
      ctrl.set(this.entities[msg.type], msg, msg);
    }
  }

  init() {
    this.connect();
    this.evtSource.addEventListener('open', event => {
      //this.msgQueue.forEach((msg) => this.evtSource.send(msg));
      this.flushSubscribe();
    });
  }

  reconnect() {
    // Exponential backoff formula to gradually increase the reconnection time
    setTimeout(
      () => {
        console.info(
          `Attempting to reconnect... (Attempt: ${this.attempts + 1})`,
        );
        this.attempts++;
        this.connect();
      },
      Math.min(10000, (Math.pow(2, this.attempts) - 1) * 1000),
    );
  }

  cleanup() {
    // remove our event handler that attempts reconnection
    this.evtSource.onclose = null;
    this.evtSource.close();
  }

  getMiddleware() {
    return this.middleware;
  }
}
/*
 * TODO:
 *
 * - off screen - slow down the feed
 * - online/offline detection
 * - handle network disconnects
 */
