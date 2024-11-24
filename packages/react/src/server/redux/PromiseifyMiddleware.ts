import type { Dispatch } from '@data-client/core';
import type React from 'react';

const PromiseifyMiddleware =
  <R extends React.Reducer<any, any>>(_: unknown) =>
  (next: Dispatch<R>) =>
  (action: ReducerAction<R>): Promise<void> => {
    next(action);
    return Promise.resolve();
  };
export default PromiseifyMiddleware;

type ReducerAction<R extends React.Reducer<any, any>> =
  R extends React.Reducer<any, infer A> ? A : never;
