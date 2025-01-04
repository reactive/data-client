import {
  State,
  Manager,
  Controller,
  ActionTypes,
  createReducer,
  applyManager,
  GCPolicy,
} from '@data-client/core';

import { combineReducers } from './combineReducers.js';
import { default as mapMiddleware } from './mapMiddleware.js';
import { default as PromiseifyMiddleware } from './PromiseifyMiddleware.js';
import { createStore, applyMiddleware } from './redux.js';
import type { Reducer, Middleware } from './redux.js';
import type { Store } from '../../context.js';

export function prepareStore<
  R extends ReducersMapObject<any, ActionTypes> = {},
>(
  initialState: DeepPartialWithUnknown<State<any>>,
  managers: Manager[],
  Ctrl: typeof Controller,
  reducers: R = {} as any,
  middlewares: Middleware[] = [] as any,
) {
  const selector = (s: { dataclient: State<unknown> }) => s.dataclient;
  const gcPolicy = new GCPolicy();
  const controller = new Ctrl({ gcPolicy });
  const reducer = createReducer(controller);
  const store: Store<
    StateFromReducersMapObject<R> & { dataclient: State<unknown> }
  > = createStore(
    combineReducers({ ...reducers, dataclient: reducer }),
    { dataclient: initialState } as any,
    applyMiddleware(
      ...mapMiddleware(selector)(
        ...(applyManager(managers, controller) as any),
      ),
      PromiseifyMiddleware as any,
      ...middlewares,
    ),
  ) as any;
  return { selector, store, controller, gcPolicy };
}

// Extension of the DeepPartial type defined by Redux which handles unknown
export type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown ? any
  : T[K] extends object ? DeepPartialWithUnknown<T[K]>
  : T[K];
};

/* From redux@5 - we extract to maintain compatibility with v4 */
type StateFromReducersMapObject<M> =
  M[keyof M] extends Reducer<any, any, any> | undefined ?
    {
      [P in keyof M]: M[P] extends Reducer<infer S, any, any> ? S : never;
    }
  : never;
type ReducersMapObject<
  S = any,
  A extends { type: string } = any,
  PreloadedState = S,
> =
  keyof PreloadedState extends keyof S ?
    {
      [K in keyof S]: Reducer<
        S[K],
        A,
        K extends keyof PreloadedState ? PreloadedState[K] : never
      >;
    }
  : never;
