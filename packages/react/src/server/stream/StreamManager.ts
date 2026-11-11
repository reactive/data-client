import { actionTypes } from '@data-client/core';
import type {
  Controller,
  EntityInterface,
  Manager,
  Middleware,
} from '@data-client/core';
import { startTransition } from 'react';

import { PIECE, applyPiece } from './applyPiece.js';
import type { ClassMap, PieceAction } from './applyPiece.js';
import type { Ledger } from './Ledger.js';

/**
 * Publishes the document's server pieces into the live store, each in a transition.
 * Learns entity classes from the page's own schema-bearing actions, so a record the
 * client wrote merges through its own class.
 */
export default class StreamManager implements Manager {
  readonly classes: ClassMap = new Map();
  declare protected ledger: Ledger;
  declare protected published: number;
  protected controller: Controller | undefined;
  protected seen = new WeakSet<object>();
  protected unsubscribe: (() => void) | undefined;

  constructor(ledger: Ledger, seedRev: number) {
    this.ledger = ledger;
    this.published = seedRev;
  }

  /** Learns entity classes from SET, FETCH, SET_RESPONSE and OPTIMISTIC. Sets `controller.reduce`. */
  middleware: Middleware = controller => {
    this.controller = controller as any;
    (controller as any).reduce = this.reduce;
    return next => action => {
      switch (action.type) {
        case actionTypes.SET:
          this.learn(action.schema);
          break;
        case actionTypes.FETCH:
        case actionTypes.SET_RESPONSE:
        case actionTypes.OPTIMISTIC:
          this.learn(action.endpoint.schema);
      }
      return next(action);
    };
  };

  protected reduce = (state: any, action: any) =>
    action.type === PIECE ?
      applyPiece(
        state,
        (action as PieceAction).piece,
        this.classes,
        this.ledger.placed,
        this.ledger.openedAt,
      )
    : state;

  /** Walks a schema like normalize does: arrays, plain objects and `.schema` */
  learn(schema: any) {
    if (
      schema === null ||
      (typeof schema !== 'object' && typeof schema !== 'function') ||
      this.seen.has(schema)
    )
      return;
    this.seen.add(schema);
    // A Collection's push, unshift and remove are views of it with their own merge;
    // a piece carries the whole list, so it merges through the Collection itself
    let cls = schema;
    while (
      typeof cls === 'object' &&
      Object.prototype.hasOwnProperty.call(cls, 'merge')
    )
      cls = Object.getPrototypeOf(cls);
    if (
      typeof cls.key === 'string' &&
      typeof cls.mergeWithStore === 'function'
    )
      this.classes.set(cls.key, cls as EntityInterface);
    if (Array.isArray(schema)) schema.forEach(s => this.learn(s));
    else if (schema.constructor === Object)
      Object.values(schema).forEach(s => this.learn(s));
    if (schema.schema !== undefined) this.learn(schema.schema);
  }

  /** Publishes every piece after the last one published, in a transition, now and on each new piece */
  init() {
    this.publish();
    this.unsubscribe = this.ledger.subscribe(this.publish);
  }

  cleanup() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  protected publish = () => {
    const controller = this.controller;
    if (!controller) return;
    const pieces = this.ledger.after(this.published);
    if (!pieces.length) return;
    this.published = pieces[pieces.length - 1].rev;
    startTransition(() => {
      for (const piece of pieces) {
        controller.dispatch({ type: PIECE, piece } as any);
      }
    });
  };
}
