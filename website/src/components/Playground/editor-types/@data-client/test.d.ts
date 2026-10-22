import { MockProps, Fixture, Interceptor } from '@data-client/core/mock';
export { ErrorFixture, ErrorFixtureEndpoint, Fixture, FixtureEndpoint, Interceptor, SuccessFixture, SuccessFixtureEndpoint, mockInitialState } from '@data-client/core/mock';
import React from 'react';
import { Manager, State, GCInterface, Controller } from '@data-client/react';
import * as _testing_library_react from '@testing-library/react';
import { Queries, RenderOptions, waitForOptions } from '@testing-library/react';
import { queries } from '@testing-library/dom';
import * as ReactDOMClient from 'react-dom/client';

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

export { type DataProviderProps, MockResolver, type RenderDataHook, type RenderDataHookResult, type RenderHookOptions, act, makeRenderDataHook as makeRenderDataClient, makeRenderDataHook, renderDataHook, renderHook };
