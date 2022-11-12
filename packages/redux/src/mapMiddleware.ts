import type { State } from '@rest-hooks/react';
import type { MiddlewareAPI, Middleware } from 'redux';

const mapMiddleware =
  <M extends Middleware[]>(selector: (state: any) => State<unknown>) =>
  (...middlewares: Middleware[]): M => {
    return middlewares.map(
      middleware =>
        ({ getState, ...args }: MiddlewareAPI) => {
          const wrapped = () => selector(getState());
          return middleware({ getState: wrapped, ...args } as any);
        },
    ) as any;
  };
export default mapMiddleware;
