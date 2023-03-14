/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Provides an abstraction over react 17 and 18 compatible libraries
 */
import type {
  Queries,
  waitForOptions,
  RenderHookOptions,
} from '@testing-library/react';
import {
  renderHook as render17Hook,
  act as act17,
} from '@testing-library/react-hooks';
import type { act as reactAct } from 'react-dom/test-utils';

import { USE18 } from './use18.cjs';

export const renderHook: RenderHook = USE18
  ? require('./render18HookWrapped.js').render18Wrapper
  : (render17Hook as any);
export default renderHook;

export const act: typeof reactAct extends undefined
  ? (callback: () => void) => void
  : typeof reactAct = USE18
  ? (require('./render18HookWrapped.js').act as any)
  : (act17 as any);

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
