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

/** Remembers each endpoint (and every entity schema reachable from it) as
 * actions pass through, since the store only holds keys and ids.
 * Lives in the preview's DataProvider; action tracking can hook in here too. */
export default class SchemaRegistry implements Manager<ActionTypes> {
  readonly endpoints = new Map<string, EndpointRecord>();
  /** Entity table key (`state.entities[key]`) → Entity class, Collection or Scalar */
  readonly entities = new Map<string, any>();

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
        break;
      case actionTypes.SET:
        this.learn(action.schema);
        break;
    }
    return next(action);
  };

  cleanup() {}

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
