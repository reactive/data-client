import type { Dispatch } from '@data-client/core';
import React from 'react';

const PromiseifyMiddleware =
  <R extends React.Reducer<any, any>>(_: unknown) =>
  (next: Dispatch<R>) =>
  (action: React.ReducerAction<R>): Promise<void> => {
    next(action);
    return Promise.resolve();
  };
export default PromiseifyMiddleware;
