import { Middleware, MiddlewareAPI } from '@rest-hooks/use-enhanced-reducer';
import { State } from '@rest-hooks/core';

const mapMiddleware =
  <M extends Middleware[]>(selector: (state: any) => State<unknown>) =>
  (...middlewares: Middleware[]): M => {
    return middlewares.map(
      middleware =>
        ({ getState, dispatch }: MiddlewareAPI) => {
          const wrapped = () => selector(getState());
          return middleware({ getState: wrapped, dispatch });
        },
    ) as any;
  };
export default mapMiddleware;
