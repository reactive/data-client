import type { Queries, waitForOptions } from '@testing-library/react';

import type { RenderHookOptions } from './renderHookOptions.js';

// we declare our own type here because the one is marked as deprecated in the react library
declare const UNDEFINED_VOID_ONLY: unique symbol;
type VoidOrUndefinedOnly = void | { [UNDEFINED_VOID_ONLY]: never };
export interface ActType {
  (callback: () => VoidOrUndefinedOnly): void;
  <T>(callback: () => T | Promise<T>): Promise<T>;
}

export type RenderHook = <
  Result,
  Props,
  Q extends Queries = Queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props, Q, Container, BaseElement>,
) => RenderHookResult<Result, Props>;

export interface RenderHookResult<Result, Props> {
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
  /* @deprecated use waitFor */
  waitForNextUpdate: (options?: waitForOptions) => Promise<void>;
  waitFor<T>(
    callback: () => Promise<T> | T,
    options?: waitForOptions,
  ): Promise<T>;
}
