import type { State } from '@data-client/core';

import type { MiddlewareAPI, Middleware } from './redux.js';

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
