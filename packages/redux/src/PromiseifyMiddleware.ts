import type { Dispatch } from '@rest-hooks/react';
import React from 'react';

const PromiseifyMiddleware =
  <R extends React.Reducer<any, any>>(_: unknown) =>
  (next: Dispatch<R>) =>
  (action: React.ReducerAction<R>): Promise<void> => {
    next(action);
    return Promise.resolve();
  };
export default PromiseifyMiddleware;
