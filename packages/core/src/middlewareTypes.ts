import type Controller from './controller/Controller.js';

export interface MiddlewareAPI<
  R extends Reducer<any, any> = Reducer<any, any>,
> {
  getState: () => ReducerState<R>;
  dispatch: Dispatch<R>;
  controller: Controller;
}

export type Dispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;

export type Middleware = <R extends Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (next: Dispatch<R>) => Dispatch<R>;

/* The next are types from React; but we don't want dependencies on it */
export type Reducer<S, A> = (prevState: S, action: A) => S;
export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<
  infer S,
  any
>
  ? S
  : never;
export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<
  any,
  infer A
>
  ? A
  : never;
