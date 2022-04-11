import {
  MiddlewareAPI,
  Middleware,
  Dispatch,
  Manager,
  State,
  createReducer,
  ActionTypes,
} from '@rest-hooks/core';

export type DevToolsConfig = {
  [k: string]: unknown;
  name: string;
};

const HASINTL = typeof Intl !== 'undefined';

/** Integrates with https://github.com/zalmoxisus/redux-devtools-extension
 *
 * Options: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
 */
export default class DevToolsManager implements Manager {
  protected declare middleware: Middleware;
  protected declare devTools: undefined | any;

  constructor(
    config: DevToolsConfig = {
      name: `Rest Hooks: ${globalThis.document?.title}`,
      autoPause: true,
      serialize: {
        // the default options are only used if serialize isn't specified, so we include the default here
        options: {
          circular: '[CIRCULAR]',
          date: true,
        },
        /* istanbul ignore next */
        replacer: (key: string | number | symbol, value: unknown) => {
          if (
            HASINTL &&
            typeof value === 'number' &&
            typeof key === 'string' &&
            isFinite(value) &&
            (key === 'date' || key.endsWith('At'))
          ) {
            return Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              fractionalSecondDigits: 3,
            }).format(value);
          }
          return value;
        },
      },
    },
    skipLogging?: (action: ActionTypes) => boolean,
  ) {
    /* istanbul ignore next */
    this.devTools =
      typeof window !== 'undefined' &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect(config);

    /* istanbul ignore if */
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development' && this.devTools) {
      this.middleware = <R extends React.Reducer<any, any>>({
        getState,
        controller,
      }: MiddlewareAPI<R>) => {
        const reducer = createReducer(controller);
        return (next: Dispatch<R>) => (action: React.ReducerAction<R>) => {
          return next(action).then(() => {
            if (skipLogging?.(action)) return;
            const state = getState();
            this.devTools.send(
              action,
              state.optimistic.reduce(reducer, state),
              undefined,
              'REST_HOOKS',
            );
          });
        };
      };
    } else {
      this.middleware = () => next => action => next(action);
    }
  }

  /** Called when initial state is ready */
  init(state: State<any>) {
    /* istanbul ignore if */
    if (this.devTools) this.devTools.init(state);
  }

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {}

  /** Attaches Manager to store
   *
   */
  getMiddleware<T extends DevToolsManager>(this: T) {
    return this.middleware;
  }
}
