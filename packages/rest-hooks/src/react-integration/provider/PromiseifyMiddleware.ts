import React from 'react';
import { MiddlewareAPI, Dispatch } from '@rest-hooks/use-enhanced-reducer';

const PromiseifyMiddleware = <R extends React.Reducer<any, any>>(
  _: MiddlewareAPI<R>,
) => (next: Dispatch<R>) => (action: React.ReducerAction<R>): Promise<void> => {
  next(action);
  return Promise.resolve();
};
export default PromiseifyMiddleware;
