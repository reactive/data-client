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
  /** Products the current socket is subscribed to */
  protected sent = new Set<string>();
  declare protected syncTimeout?: ReturnType<typeof setTimeout>;
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
    this.evtSource = this.createEventSource();
    this.evtSource.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    this.evtSource.onopen = () => {
      console.info('WebSocket connected');
      // Reset reconnection attempts after a successful connection
      this.attempts = 0;
      // A new socket has no subscriptions, so (re)subscribe everything active
      this.sent.clear();
      this.sync();
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

  subscribe(product_id: string | undefined) {
    if (!product_id) return;
    this.subscriptions.set(
      product_id,
      (this.subscriptions.get(product_id) ?? 0) + 1,
    );
    this.syncTimeout ??= setTimeout(this.sync, 5);
  }

  unsubscribe(product_id: string | undefined) {
    if (!product_id) return;
    const count = this.subscriptions.get(product_id) ?? 0;
    if (count > 1) this.subscriptions.set(product_id, count - 1);
    else this.subscriptions.delete(product_id);
    this.syncTimeout ??= setTimeout(this.sync, 5);
  }

  /** Sends the difference between active and sent subscriptions, batched */
  sync = () => {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = undefined;
    // onopen syncs again once connected
    if (this.evtSource.readyState !== this.evtSource.OPEN) return;
    const active = [...this.subscriptions.keys()];
    this.sendChannel(
      'subscribe',
      active.filter(id => !this.sent.has(id)),
    );
    this.sendChannel(
      'unsubscribe',
      [...this.sent].filter(id => !this.subscriptions.has(id)),
    );
    this.sent = new Set(active);
  };

  protected sendChannel(
    type: 'subscribe' | 'unsubscribe',
    product_ids: string[],
  ) {
    if (product_ids.length)
      this.evtSource.send(
        JSON.stringify({ type, product_ids, channels: ['ticker'] }),
      );
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
    // detach handlers so the closing socket can't reconnect or touch a new one
    this.evtSource.onopen = null;
    this.evtSource.onmessage = null;
    this.evtSource.onclose = null;
    this.evtSource.onerror = null;
    this.evtSource.close();
    // a pending reconnect would open a new socket after we are gone
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = undefined;
    clearTimeout(this.syncTimeout);
    this.syncTimeout = undefined;
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
