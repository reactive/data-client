import { Manager, MiddlewareAPI, Middleware, Dispatch } from 'rest-hooks';
import { act } from 'react-test-renderer';

export default class ActDispatchManager implements Manager {
  protected declare middleware: Middleware;

  constructor() {
    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (
        action: React.ReducerAction<R>,
      ): Promise<void> => {
        return act(() => next(action));
      };
    };
  }

  cleanup() {}

  getMiddleware<T extends ActDispatchManager>(this: T) {
    return this.middleware;
  }
}
