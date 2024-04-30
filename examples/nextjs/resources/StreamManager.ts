import type { Manager, Middleware } from '@data-client/react';
import type { EndpointInterface } from '@data-client/rest';
import { ActionTypes, Controller, actionTypes } from '@data-client/react';

/** Updates crypto data using Coinbase websocket stream
 *
 * https://docs.cloud.coinbase.com/advanced-trade-api/docs/ws-overview
 */
export default class StreamManager implements Manager {
  protected declare middleware: Middleware<ActionTypes>;
  protected declare evtSource: WebSocket; // | EventSource;
  protected declare endpoints: Record<string, EndpointInterface>;
  protected msgQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] =
    [];

  protected product_ids: string[] = [];
  private attempts = 0;
  protected declare connect: () => void;

  constructor(
    evtSource: () => WebSocket, // | EventSource,
    endpoints: Record<string, EndpointInterface>,
  ) {
    this.endpoints = endpoints;

    this.middleware = controller => {
      this.connect = () => {
        this.evtSource = evtSource();
        this.evtSource.onmessage = event => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(controller, msg);
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
      return next => async action => {
        switch (action.type) {
          case actionTypes.SUBSCRIBE_TYPE:
            // only process registered endpoints
            if (
              !Object.values(this.endpoints).find(
                endpoint => endpoint.key === action.endpoint.key,
              )
            )
              break;
            if ('channel' in action.endpoint) {
              this.subscribe(action.meta.args[0]?.product_id);
              // consume subscription if we use it
              return Promise.resolve();
            }

            return next(action);
          case actionTypes.UNSUBSCRIBE_TYPE:
            // only process registered endpoints
            if (
              !Object.values(this.endpoints).find(
                endpoint => endpoint.key === action.endpoint.key,
              )
            )
              break;
            if ('channel' in action.endpoint) {
              this.send(
                JSON.stringify({
                  type: 'unsubscribe',
                  product_ids: [action.meta.args[0]?.product_id],
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
  }

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

  handleMessage(controller: Controller, msg: any) {
    if (msg.type in this.endpoints)
      controller.setResponse(this.endpoints[msg.type], msg, msg);
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
