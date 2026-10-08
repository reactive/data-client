import React from 'react';
import { EndpointInterface, ResolveType, Manager, State, GCInterface, Controller } from '@data-client/react';
import * as _testing_library_react from '@testing-library/react';
import { Queries, RenderOptions, waitForOptions } from '@testing-library/react';
import { queries } from '@testing-library/dom';
import * as ReactDOMClient from 'react-dom/client';
export { mockInitialState } from '@data-client/core/mock';

type Updater = (result: any, ...args: any) => Record<string, (...args: any) => any>;
interface SuccessFixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> {
    readonly endpoint: E;
    readonly args: Readonly<Parameters<E>>;
    readonly response: ResolveType<E> | ((...args: Parameters<E>) => ResolveType<E>);
    readonly error?: false;
    /** Number of miliseconds to wait before resolving */
    readonly delay?: number;
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
interface ResponseInterceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
} = EndpointInterface & {
    testKey(key: string): boolean;
}> {
    readonly endpoint: E;
    response(this: T, ...args: Parameters<E>): ResolveType<E>;
    /** Number of miliseconds (or function that returns) to wait before resolving */
    readonly delay?: number | ((...args: Parameters<E>) => number);
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
interface FetchInterceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
} = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}> {
    readonly endpoint: E;
    fetchResponse(this: T, input: RequestInfo, init: RequestInit): ResolveType<E>;
    /** Number of miliseconds (or function that returns) to wait before resolving */
    readonly delay?: number | ((...args: Parameters<E>) => number);
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
/** Interceptors match and compute dynamic responses based on args
 *
 * @see https://dataclient.io/docs/api/Fixtures#interceptor
 */
type Interceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse?(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend?(options: any): any;
} = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}> = ResponseInterceptor<T, E> | (E extends ({
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}) ? FetchInterceptor<T, E> : never);
interface ErrorFixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> {
    readonly endpoint: E;
    readonly args: Readonly<Parameters<E>>;
    readonly response: any;
    readonly error: true;
    /** Number of miliseconds to wait before resolving */
    readonly delay?: number;
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
type FixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = SuccessFixtureEndpoint<E> | ErrorFixtureEndpoint<E>;
/** Represents a successful response
 *
 * @see https://dataclient.io/docs/api/Fixtures#successfixture
 */
type SuccessFixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = SuccessFixtureEndpoint<E>;
/** Represents a failed/errored response
 *
 * @see https://dataclient.io/docs/api/Fixtures#errorfixtures
 */
type ErrorFixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = ErrorFixtureEndpoint<E>;
/** Represents a static response
 *
 * @see https://dataclient.io/docs/api/Fixtures
 */
type Fixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = FixtureEndpoint<E>;

interface MockProps<T = any> {
    readonly fixtures?: (Fixture | Interceptor<T>)[];
    getInitialInterceptorData?: () => T;
}

interface MockResolverProps<T> extends MockProps<T> {
    children: React.ReactNode;
    silenceMissing?: boolean;
}
/** Can be used to mock responses based on fixtures provided.
 *
 * <MockResolver fixtures={postFixtures[state]}><MyComponent /></MockResolver>
 *
 * Place below <DataProvider /> and above any components you want to mock.
 */
declare function MockResolver<T = any>({ children, fixtures, getInitialInterceptorData, }: MockResolverProps<T>): React.JSX.Element;

type RenderHookOptions<Props, Q extends Queries = typeof queries, Container extends RendererableContainer | HydrateableContainer = HTMLElement, BaseElement extends RendererableContainer | HydrateableContainer = Container> = _testing_library_react.RenderHookOptions<Props, Q, Container, BaseElement> | (RenderOptions<Q, Container, BaseElement> & {
    /**
     * The argument passed to the renderHook callback. Can be useful if you plan
     * to use the rerender utility to change the values passed to your hook.
     */
    initialProps?: Props | undefined;
});
type RendererableContainer = ReactDOMClient.Container;
type HydrateableContainer = Parameters<(typeof ReactDOMClient)['hydrateRoot']>[0];

declare const UNDEFINED_VOID_ONLY: unique symbol;
type VoidOrUndefinedOnly = void | {
    [UNDEFINED_VOID_ONLY]: never;
};
interface ActType {
    (callback: () => VoidOrUndefinedOnly): void;
    <T>(callback: () => T | Promise<T>): Promise<T>;
}
type RenderHook = <Result, Props, Q extends Queries = Queries, Container extends Element | DocumentFragment = HTMLElement, BaseElement extends Element | DocumentFragment = Container>(render: (initialProps: Props) => Result, options?: RenderHookOptions<Props, Q, Container, BaseElement>) => RenderHookResult<Result, Props>;
interface RenderHookResult<Result, Props> {
    /**
     * Triggers a re-render. The props will be passed to your renderHook callback.
     */
    rerender: (props?: Props) => void;
    /**
     * This is a stable reference to the latest value returned by your renderHook
     * callback
     */
    result: {
        /**
         * The value returned by your renderHook callback
         */
        current: Result;
        error?: Error;
    };
    /**
     * Unmounts the test component. This is useful for when you need to test
     * any cleanup your useEffects have.
     */
    unmount: () => void;
    waitForNextUpdate: (options?: waitForOptions) => Promise<void>;
    waitFor<T>(callback: () => Promise<T> | T, options?: waitForOptions): Promise<T>;
}

/** @see https://dataclient.io/docs/api/makeRenderDataHook */
declare function makeRenderDataHook(Provider: React.ComponentType<DataProviderProps>): RenderDataHook;
interface DataProviderProps {
    children: React.ReactNode;
    managers: Manager[];
    initialState: State<unknown>;
    Controller: new (props: {
        gcPolicy: GCInterface;
    }) => Controller<any>;
    devButton: any;
}
type RenderDataHookResult<R, P> = RenderHookResult<R, P> & {
    controller: Controller;
    cleanup: () => void;
    allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};
type RenderDataHook = (<P, R>(callback: (props: P) => R, options?: {
    initialProps?: P;
    initialFixtures?: readonly Fixture[];
    readonly resolverFixtures?: readonly (Fixture | Interceptor)[];
    wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
} & Omit<RenderHookOptions<P>, 'initialProps' | 'wrapper'>) => RenderDataHookResult<R, P>) & {
    /** @deprecated use per-render cleanup returned from renderDataClient() instead */
    cleanup: () => void;
    /** @deprecated use per-render allSettled returned from renderDataClient() instead */
    allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};

/** Unit test hooks that rely on DataProvider
 *
 * @see https://dataclient.io/docs/api/renderDataHook
 */
declare const renderDataHook: RenderDataHook;

declare const act: ActType;
declare const renderHook: RenderHook;

export { type DataProviderProps, type ErrorFixture, type ErrorFixtureEndpoint, type Fixture, type FixtureEndpoint, type Interceptor, MockResolver, type RenderDataHook, type RenderDataHookResult, type RenderHookOptions, type SuccessFixture, type SuccessFixtureEndpoint, act, makeRenderDataHook as makeRenderDataClient, makeRenderDataHook, renderDataHook, renderHook };
