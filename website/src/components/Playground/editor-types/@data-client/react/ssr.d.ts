import * as _data_client_core from '@data-client/core';
import { Manager, State, Controller } from '@data-client/core';
import * as react_jsx_runtime from 'react/jsx-runtime';

/**
 * An *action* is a plain object that represents an intention to change the
 * state. Actions are the only way to get data into the store. Any data,
 * whether from UI events, network callbacks, or other sources such as
 * WebSockets needs to eventually be dispatched as actions.
 *
 * Actions must have a `type` field that indicates the type of action being
 * performed. Types can be defined as constants and imported from another
 * module. These must be strings, as strings are serializable.
 *
 * Other than `type`, the structure of an action object is really up to you.
 * If you're interested, check out Flux Standard Action for recommendations on
 * how actions should be constructed.
 *
 * @template T the type of the action's `type` tag.
 */
type Action<T extends string = string> = {
  type: T;
};
/**
 * An Action type which accepts any other properties.
 * This is mainly for the use of the `Reducer` type.
 * This is not part of `Action` itself to prevent types that extend `Action` from
 * having an index signature.
 */
interface UnknownAction extends Action {
  [extraProps: string]: unknown;
}

/**
 * A *dispatching function* (or simply *dispatch function*) is a function that
 * accepts an action or an async action; it then may or may not dispatch one
 * or more actions to the store.
 *
 * We must distinguish between dispatching functions in general and the base
 * `dispatch` function provided by the store instance without any middleware.
 *
 * The base dispatch function *always* synchronously sends an action to the
 * store's reducer, along with the previous state returned by the store, to
 * calculate a new state. It expects actions to be plain objects ready to be
 * consumed by the reducer.
 *
 * Middleware wraps the base dispatch function. It allows the dispatch
 * function to handle async actions in addition to actions. Middleware may
 * transform, delay, ignore, or otherwise interpret actions or async actions
 * before passing them to the next middleware.
 *
 * @template A The type of things (actions or otherwise) which may be
 *   dispatched.
 */
interface Dispatch<A extends Action = UnknownAction> {
  <T extends A>(action: T, ...extraArgs: any[]): T;
}
/**
 * Function to remove listener added by `Store.subscribe()`.
 */
interface Unsubscribe {
  (): void;
}
type ListenerCallback = () => void;
declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}
/**
 * A store is an object that holds the application's state tree.
 * There should only be a single store in a Redux app, as the composition
 * happens on the reducer level.
 *
 * @template S The type of state held by this store.
 * @template A the type of actions which may be dispatched by this store.
 * @template StateExt any extension to state from store enhancers
 */
interface Store<S = any, A extends Action = UnknownAction, StateExt = unknown> {
  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will be
   * considered the **next** state of the tree, and the change listeners will
   * be notified.
   *
   * The base implementation only supports plain object actions. If you want
   * to dispatch a Promise, an Observable, a thunk, or something else, you
   * need to wrap your store creating function into the corresponding
   * middleware. For example, see the documentation for the `redux-thunk`
   * package. Even the middleware will eventually dispatch plain object
   * actions using this method.
   *
   * @param action A plain object representing “what changed”. It is a good
   *   idea to keep actions serializable so you can record and replay user
   *   sessions, or use the time travelling `redux-devtools`. An action must
   *   have a `type` property which may not be `undefined`. It is a good idea
   *   to use string constants for action types.
   *
   * @returns For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  dispatch: Dispatch<A>;
  /**
   * Reads the state tree managed by the store.
   *
   * @returns The current state tree of your application.
   */
  getState(): S & StateExt;
  /**
   * Adds a change listener. It will be called any time an action is
   * dispatched, and some part of the state tree may potentially have changed.
   * You may then call `getState()` to read the current state tree inside the
   * callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked,
   * this will not have any effect on the `dispatch()` that is currently in
   * progress. However, the next `dispatch()` call, whether nested or not,
   * will use a more recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all states changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param listener A callback to be invoked on every dispatch.
   * @returns A function to remove this change listener.
   */
  subscribe(listener: ListenerCallback): Unsubscribe;
  // /**
  //  * Replaces the reducer currently used by the store to calculate the state.
  //  *
  //  * You might need this if your app implements code splitting and you want to
  //  * load some of the reducers dynamically. You might also need this if you
  //  * implement a hot reloading mechanism for Redux.
  //  *
  //  * @param nextReducer The reducer for the store to use instead.
  //  */
  // replaceReducer(nextReducer: Reducer<S, A>): void;
  // /**
  //  * Interoperability point for observable/reactive libraries.
  //  * @returns {observable} A minimal observable of state changes.
  //  * For more information, see the observable proposal:
  //  * https://github.com/tc39/proposal-observable
  //  */
  // [Symbol.observable](): Observable<S & StateExt>;
}

declare function createPersistedStore(managers?: Manager[]): readonly [({ children }: {
    children: React.ReactNode;
}) => react_jsx_runtime.JSX.Element, () => State<unknown>, Controller<_data_client_core.DataClientDispatch>, Store<State<unknown>, _data_client_core.ActionTypes, unknown> & {
    dispatch: unknown;
}];

declare const awaitInitialData: (id?: string) => Promise<any>;
declare const getInitialData: (id?: string) => any;

declare function createServerDataComponent(useReadyCacheState: () => State<unknown>, id?: string): ({ nonce }: {
    nonce?: string | undefined;
}) => react_jsx_runtime.JSX.Element;

declare const ServerData: ({ data, nonce, id, }: {
    data: State<unknown>;
    id?: string;
    nonce?: string | undefined;
}) => react_jsx_runtime.JSX.Element | null;

export { ServerData, awaitInitialData, createPersistedStore, createServerDataComponent, getInitialData };
