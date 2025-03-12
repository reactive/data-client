import * as _data_client_core from '@data-client/core';
import { ActionTypes, State, Manager, Controller, GCInterface, Dispatch as Dispatch$1 } from '@data-client/core';
export { applyManager, createReducer, initialState } from '@data-client/core';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

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
 * A *reducer* is a function that accepts
 * an accumulation and a value and returns a new accumulation. They are used
 * to reduce a collection of values down to a single value
 *
 * Reducers are not unique to Redux—they are a fundamental concept in
 * functional programming.  Even most non-functional languages, like
 * JavaScript, have a built-in API for reducing. In JavaScript, it's
 * `Array.prototype.reduce()`.
 *
 * In Redux, the accumulated value is the state object, and the values being
 * accumulated are actions. Reducers calculate a new state given the previous
 * state and an action. They must be *pure functions*—functions that return
 * the exact same output for given inputs. They should also be free of
 * side-effects. This is what enables exciting features like hot reloading and
 * time travel.
 *
 * Reducers are the most important concept in Redux.
 *
 * *Do not put API calls into reducers.*
 *
 * @template S The type of state consumed and produced by this reducer.
 * @template A The type of actions the reducer can potentially respond to.
 * @template PreloadedState The type of state consumed by this reducer the first time it's called.
 */
type Reducer<S = any, A extends Action = UnknownAction, PreloadedState = S> = (
  state: S | PreloadedState | undefined,
  action: A,
) => S;

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
declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
  dispatch: D;
  getState(): S;
}
/**
 * A middleware is a higher-order function that composes a dispatch function
 * to return a new dispatch function. It often turns async actions into
 * actions.
 *
 * Middleware is composable using function composition. It is useful for
 * logging actions, performing side effects like routing, or turning an
 * asynchronous API call into a series of synchronous actions.
 *
 * @template DispatchExt Extra Dispatch signature added by this middleware.
 * @template S The type of the state supported by this middleware.
 * @template D The type of Dispatch of the store where this middleware is
 *   installed.
 */
interface Middleware<
  _DispatchExt = {}, // TODO: see if this can be used in type definition somehow (can't be removed, as is used to get final dispatch type)
  S = any,
  D extends Dispatch = Dispatch,
> {
  (
    api: MiddlewareAPI<D, S>,
  ): (next: (action: unknown) => unknown) => (action: unknown) => unknown;
}

interface Store$1<S> {
    subscribe(listener: () => void): () => void;
    getState(): S;
    uninitialized?: boolean;
}

declare function prepareStore<R extends ReducersMapObject<any, ActionTypes> = {}>(initialState: DeepPartialWithUnknown<State<any>>, managers: Manager[], Ctrl: typeof Controller, reducers?: R, middlewares?: Middleware[], gcPolicy?: GCInterface): {
    selector: (s: {
        dataclient: State<unknown>;
    }) => State<unknown>;
    store: Store$1<StateFromReducersMapObject<R> & {
        dataclient: State<unknown>;
    }>;
    controller: Controller<_data_client_core.DataClientDispatch>;
};
type DeepPartialWithUnknown<T> = {
    [K in keyof T]?: T[K] extends unknown ? any : T[K] extends object ? DeepPartialWithUnknown<T[K]> : T[K];
};
type StateFromReducersMapObject<M> = M[keyof M] extends Reducer<any, any, any> | undefined ? {
    [P in keyof M]: M[P] extends Reducer<infer S, any, any> ? S : never;
} : never;
type ReducersMapObject<S = any, A extends {
    type: string;
} = any, PreloadedState = S> = keyof PreloadedState extends keyof S ? {
    [K in keyof S]: Reducer<S[K], A, K extends keyof PreloadedState ? PreloadedState[K] : never>;
} : never;

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/** For usage with https://dataclient.io/docs/api/makeRenderDataHook */
declare function TestExternalDataProvider({ children, managers, initialState, Controller, gcPolicy, devButton, }: Props$1): react_jsx_runtime.JSX.Element;
interface Props$1 {
    children: React.ReactNode;
    managers: Manager[];
    initialState: State<unknown>;
    Controller: typeof Controller;
    gcPolicy?: GCInterface;
    devButton?: DevToolsPosition | null | undefined;
}

interface Store<S> {
    subscribe(listener: () => void): () => void;
    getState(): S;
}
interface Props<S> {
    children: React.ReactNode;
    store: Store<S>;
    selector: (state: S) => State<unknown>;
    controller: Controller;
    devButton?: DevToolsPosition | null | undefined;
    hasDevManager?: boolean;
}
/**
 * Like DataProvider, but for an external store
 * @see https://dataclient.io/docs/api/ExternalDataProvider
 */
declare function ExternalDataProvider<S>({ children, store, selector, controller, devButton, hasDevManager, }: Props<S>): react_jsx_runtime.JSX.Element;

declare const mapMiddleware: <M extends Middleware[]>(selector: (state: any) => State<unknown>) => (...middlewares: Middleware[]) => M;
//# sourceMappingURL=mapMiddleware.d.ts.map

declare const PromiseifyMiddleware: <R extends React.Reducer<any, any>>(_: unknown) => (next: Dispatch$1<R>) => (action: ReducerAction<R>) => Promise<void>;

type ReducerAction<R extends React.Reducer<any, any>> = R extends React.Reducer<any, infer A> ? A : never;
//# sourceMappingURL=PromiseifyMiddleware.d.ts.map

export { TestExternalDataProvider as DataProvider, ExternalDataProvider, type Middleware, PromiseifyMiddleware, type Reducer, mapMiddleware, prepareStore };
