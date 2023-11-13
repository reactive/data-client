import { State, Manager, Controller, __INTERNAL__ } from '@data-client/react';
import { createStore, applyMiddleware, combineReducers, Reducer } from 'redux';

import { default as mapMiddleware } from './mapMiddleware.js';
import { default as PromiseifyMiddleware } from './PromiseifyMiddleware.js';

const { createReducer, applyManager } = __INTERNAL__;

export function prepareStore<R extends Record<string, Reducer> = {}>(
  initialState: DeepPartialWithUnknown<State<any>>,
  managers: Manager[],
  Ctrl: typeof Controller,
  reducers: R = {} as any,
) {
  const selector = (s: { dataclient: State<unknown> }) => s.dataclient;
  const controller = new Ctrl();
  const reducer = createReducer(controller);
  const store = createStore(
    combineReducers({ ...reducers, dataclient: reducer }),
    { dataclient: initialState } as any,
    applyMiddleware(
      ...mapMiddleware(selector)(...applyManager(managers, controller)),
      PromiseifyMiddleware,
    ),
  );
  return { selector, store, controller };
}

// Extension of the DeepPartial type defined by Redux which handles unknown
export type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown ? any
  : T[K] extends object ? DeepPartialWithUnknown<T[K]>
  : T[K];
};
