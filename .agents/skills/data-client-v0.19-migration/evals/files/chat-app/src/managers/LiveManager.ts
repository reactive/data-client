import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

import { Message, MessageResource } from '../resources';

/** Pushes new messages from the server into the store, and tells the server what we sent. */
export default class LiveManager implements Manager {
  protected socket?: WebSocket;
  // ids of messages this store has already received
  protected received = new Set<string>();

  constructor(protected url: string) {}

  getMiddleware = (): Middleware => controller => {
    this.socket = new WebSocket(this.url);
    this.socket.onmessage = event => {
      const message: Message = JSON.parse(event.data);
      if (this.received.has(message.id)) return;
      this.received.add(message.id);
      controller.set(Message, { id: message.id }, message);
    };
    return next => async action => {
      if (
        action.type === actionTypes.SET_RESPONSE &&
        action.endpoint === MessageResource.getList.push
      ) {
        this.socket!.send(JSON.stringify({ type: 'sent', key: action.key }));
      }
      return next(action);
    };
  };

  cleanup() {
    this.socket?.close();
    this.received.clear();
  }
}
