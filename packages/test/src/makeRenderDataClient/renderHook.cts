/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Provides an abstraction over react 17 and 18 compatible libraries
 */
import type {
  Queries,
  waitForOptions,
  RenderHookOptions,
} from '@testing-library/react';

import { USE18 } from './use18.cjs';

export const renderHook: RenderHook =
  USE18 ?
    require('./render18HookWrapped.js').render18Wrapper
  : (require('@testing-library/react-hooks').renderHook as any);
export default renderHook;

// we declare our own type here because the one is marked as deprecated in the react library
declare const UNDEFINED_VOID_ONLY: unique symbol;
type VoidOrUndefinedOnly = void | { [UNDEFINED_VOID_ONLY]: never };
interface ActType {
  (callback: () => VoidOrUndefinedOnly): void;
  <T>(callback: () => T | Promise<T>): Promise<T>;
}

// this is for react native + react web compatibility, not actually 18 compatibility
export const act: ActType =
  USE18 ?
    require('./render18HookWrapped.js').act
  : (require('@testing-library/react-hooks').act as any);

export type { RenderHookOptions } from '@testing-library/react';

type RenderHook = <
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
