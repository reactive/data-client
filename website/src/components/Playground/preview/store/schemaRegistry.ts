import {
  actionTypes,
  type ActionTypes,
  type Manager,
  type Middleware,
} from '@data-client/react';

import { forEachChildSchema, isEntityLike } from './refs';

export interface EndpointRecord {
  readonly endpoint: any;
  readonly args: readonly unknown[];
}

export interface PendingOptimistic {
  readonly key: string;
  readonly args: readonly unknown[];
  readonly fetchedAt: number;
}

/** Remembers each endpoint (and every entity schema reachable from it) as
 * actions pass through, since the store only holds keys and ids.
 * Lives in the preview's DataProvider; extend this manager (rather than
 * adding another) when the preview starts tracking actions.
 * Never prunes: fine for a playground session, not for a long-lived app. */
export default class SchemaRegistry implements Manager<ActionTypes> {
  readonly endpoints = new Map<string, EndpointRecord>();
  /** Entity table key (`state.entities[key]`) → Entity class, Collection or Scalar */
  readonly entities = new Map<string, any>();
  /** Optimistic updates awaiting their response. The store's own queue is
   * already applied (and so emptied) in the state components can read. */
  optimistic: readonly PendingOptimistic[] = [];

  middleware: Middleware<ActionTypes> = () => next => action => {
    switch (action.type) {
      case actionTypes.FETCH:
      case actionTypes.SET_RESPONSE:
      case actionTypes.OPTIMISTIC:
        this.endpoints.set(action.key, {
          endpoint: action.endpoint,
          args: action.args,
        });
        this.learn(action.endpoint.schema);
        this.trackOptimistic(action);
        break;
      case actionTypes.RESET:
        this.optimistic = [];
        break;
      case actionTypes.SET:
        this.learn(action.schema);
        break;
    }
    return next(action);
  };

  cleanup() {}

  /** Mirrors core's fetchReducer and filterOptimistic */
  private trackOptimistic(action: any) {
    const { key, args, endpoint, meta } = action;
    if (action.type === actionTypes.FETCH) {
      if (endpoint.getOptimisticResponse && endpoint.sideEffect)
        this.optimistic = [
          ...this.optimistic,
          { key, args, fetchedAt: meta.fetchedAt },
        ];
    } else if (action.type === actionTypes.SET_RESPONSE) {
      this.optimistic = this.optimistic.filter(
        o => o.key !== key || o.fetchedAt !== meta.fetchedAt,
      );
    }
  }

  learn(schema: any) {
    if (!schema || (typeof schema !== 'object' && typeof schema !== 'function'))
      return;
    if (isEntityLike(schema)) {
      if (this.entities.get(schema.key) === schema) return;
      this.entities.set(schema.key, schema);
    }
    forEachChildSchema(schema, child => this.learn(child));
  }
}
