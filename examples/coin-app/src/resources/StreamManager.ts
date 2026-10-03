import type { Manager, Middleware } from '@data-client/react';
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

  /** Subscriber count per product; re-sent on every (re)connect */
  protected subscriptions = new Map<string, number>();
  /** Products waiting to be sent in the next subscribe message */
  protected product_ids: string[] = [];
  /** Messages waiting to be written, grouped by entity type */
  protected buffer: Record<string, Record<string, any>> = {};
  declare protected flushTimeout?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  declare protected reconnectTimeout?: ReturnType<typeof setTimeout>;
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
            this.unsubscribe(action.args[0]?.product_id);
            return Promise.resolve();
          }
          return next(action);
        default:
          return next(action);
      }
    };
  };

  connect = () => {
    const ws = this.createEventSource();
    this.evtSource = ws;
    // a replaced socket can still fire events (e.g. error after close())
    const isCurrent = () => ws === this.evtSource;
    ws.onmessage = event => {
      if (!isCurrent()) return;
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    ws.onopen = () => {
      if (!isCurrent()) return;
      console.info('WebSocket connected');
      // Reset reconnection attempts after a successful connection
      this.attempts = 0;
      // A new socket has no subscriptions, so (re)subscribe everything active
      this.product_ids = [...this.subscriptions.keys()];
      this.flushSubscribe();
    };
    ws.onclose = () => {
      if (!isCurrent()) return;
      console.info('WebSocket disconnected');
      this.reconnect();
    };
    ws.onerror = error => {
      if (!isCurrent()) return;
      console.error('WebSocket error:', error);
      // Ensures that the onclose handler gets triggered for reconnection
      ws.close();
    };
  };

  /** Sends only while open; onopen re-subscribes, so nothing needs queueing */
  send(data: Parameters<WebSocket['send']>[0]): void {
    if (this.evtSource.readyState === this.evtSource.OPEN) {
      this.evtSource.send(data);
    }
  }

  subscribe(product_id: string | undefined) {
    if (!product_id) return;
    const count = this.subscriptions.get(product_id) ?? 0;
    this.subscriptions.set(product_id, count + 1);
    // already subscribed, or onopen will subscribe it
    if (count || this.evtSource.readyState !== this.evtSource.OPEN) return;
    this.product_ids.push(product_id);
    // batch subscriptions made in the same tick into one message
    if (this.product_ids.length === 1)
      setTimeout(() => this.flushSubscribe(), 5);
  }

  unsubscribe(product_id: string | undefined) {
    if (!product_id) return;
    const count = this.subscriptions.get(product_id) ?? 0;
    if (count > 1) {
      this.subscriptions.set(product_id, count - 1);
      return;
    }
    this.subscriptions.delete(product_id);
    // never sent yet
    if (this.product_ids.includes(product_id)) {
      this.product_ids = this.product_ids.filter(id => id !== product_id);
      return;
    }
    this.send(
      JSON.stringify({
        type: 'unsubscribe',
        product_ids: [product_id],
        channels: ['ticker'],
      }),
    );
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
   * Messages are buffered so bursts become a single store update.
   * Only the latest message per product is kept, since rows in one batch
   * skip Ticker.shouldReorder()
   *
   * @param msg JSON parsed message
   */
  handleMessage(msg: any) {
    if (msg.type in this.entities) {
      (this.buffer[msg.type] ??= {})[msg.product_id] = msg;
      this.flushTimeout ??= setTimeout(this.flush, 50);
    }
  }

  /** Writes all buffered messages; one `set()` per entity type */
  flush = () => {
    const buffer = this.buffer;
    this.buffer = {};
    this.flushTimeout = undefined;
    for (const type in buffer) {
      this.controller.set([this.entities[type]], Object.values(buffer[type]));
    }
  };

  init() {
    this.connect();
  }

  reconnect() {
    // Exponential backoff formula to gradually increase the reconnection time
    this.reconnectTimeout = setTimeout(
      () => {
        this.reconnectTimeout = undefined;
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
    // a pending reconnect would open a new socket after we are gone
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = undefined;
    this.attempts = 0;
    clearTimeout(this.flushTimeout);
    this.flushTimeout = undefined;
    this.buffer = {};
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
