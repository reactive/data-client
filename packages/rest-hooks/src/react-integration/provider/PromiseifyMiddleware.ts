import React from 'react';
import { Dispatch } from '@rest-hooks/core';

const PromiseifyMiddleware =
  <R extends React.Reducer<any, any>>(_: unknown) =>
  (next: Dispatch<R>) =>
  (action: React.ReducerAction<R>): Promise<void> => {
    next(action);
    return Promise.resolve();
  };
export default PromiseifyMiddleware;
