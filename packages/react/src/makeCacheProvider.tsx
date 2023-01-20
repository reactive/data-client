import { actionTypes, CombinedActionTypes } from '@rest-hooks/core';
import React from 'react';

import { State, CacheProvider, Manager, Controller } from './index.js';

export default function makeCacheProvider(
  managers: Manager[],
  initialState?: State<unknown>,
  act?: Act,
): (props: { children: React.ReactNode }) => JSX.Element {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    class ActController<
      D extends GenericDispatch = CompatibleDispatch,
    > extends Controller<D> {
      #dispatch: any;

      constructor(...args: any) {
        super(...args);
        const set = (dispatch: any) => {
          if (act) {
            this.#dispatch = (v: any) => {
              let promise: any;
              if (
                [actionTypes.FETCH_TYPE, actionTypes.RECEIVE_TYPE].includes(
                  v.type,
                )
              ) {
                act(() => {
                  promise = dispatch(v);
                });
              } else {
                return dispatch(v);
              }
              return promise;
            };
          } else {
            this.#dispatch = dispatch;
          }
        };
        set(this.dispatch);
        Object.defineProperty(this, 'dispatch', {
          get: () => this.#dispatch,
          set,
        });
      }
    }
    if (initialState) {
      return (
        <CacheProvider
          managers={managers}
          initialState={initialState}
          Controller={ActController}
        >
          {children}
        </CacheProvider>
      );
    } else {
      return (
        <CacheProvider managers={managers} Controller={ActController}>
          {children}
        </CacheProvider>
      );
    }
  };
}

export type GenericDispatch = (value: any) => Promise<void>;
export type CompatibleDispatch = (value: CombinedActionTypes) => Promise<void>;
type Act = {
  (callback: () => Promise<void | undefined>): Promise<undefined>;
  (callback: () => void | undefined): void;
};
