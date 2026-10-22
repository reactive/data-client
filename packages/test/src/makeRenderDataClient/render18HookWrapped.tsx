/**
 * Provides an abstraction over react 17 and 18 compatible libraries
 */
import { ErrorBoundary } from '@data-client/react';
import type { Queries, waitForOptions } from '@testing-library/react';
import { Suspense } from 'react';

import { act, waitFor, renderHook, RenderHookOptions } from './render18Hook.js';
import type { RenderHookResult } from './renderHookTypes.js';

export { act };

export function render18Wrapper<
  Result,
  Props,
  Q extends Queries = Queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props, Q, Container, BaseElement>,
): RenderHookResult<Result, Props> {
  let renderProps: any = options?.initialProps;
  let error: any;
  const setError = (e: any) => {
    error = e;
  };
  let resetErrorBoundary = () => {};
  const ErrorFallback = ({ error, resetErrorBoundary: reset }: any) => {
    resetErrorBoundary = () => {
      resetErrorBoundary = () => {};
      setTimeout(reset, 0);
    };
    setError(error);
    return null;
  };

  let resultUndefined = false;
  const setResultUndefined = () => {
    resultUndefined = true;
  };
  const SetUndefined = () => {
    setResultUndefined();
    return null;
  };

  const WithErrorWrap = (props: any) => {
    resetErrorBoundary();
    resultUndefined = false;

    return (
      <Suspense fallback={<SetUndefined />}>
        <ErrorBoundary fallbackComponent={ErrorFallback}>
          {props.children}
        </ErrorBoundary>
      </Suspense>
    );
  };

  // TODO: add error and waitforupdate
  const Wrapper = options?.wrapper;
  const wrapper: React.ComponentType<any> =
    Wrapper ?
      function ProviderWrapped(props: React.PropsWithChildren<any>) {
        return (
          <Wrapper {...renderProps} {...props}>
            <WithErrorWrap>{props.children}</WithErrorWrap>
          </Wrapper>
        );
      }
    : WithErrorWrap;

  const render18Result = renderHook(render, {
    ...options,
    wrapper,
  });
  const ret: RenderHookResult<Result, Props> = Object.create(render18Result, {
    result: {
      value: {
        get current(): any {
          return render18Result.result.current === null ?
              undefined
            : render18Result.result.current;
        },
        get error() {
          return error;
        },
      },
    },
    rerender: {
      value: (props?: any) => {
        renderProps = props;
        render18Result.rerender(props);
      },
    },
    waitFor: {
      value: waitFor,
    },
    waitForNextUpdate: {
      value: async (options?: waitForOptions) => {
        const previousCurrent = ret.result.current;
        const prevError = error;
        const isMockTimers =
          typeof jest !== 'undefined' &&
          (setTimeout as any).clock != null &&
          typeof (setTimeout as any).clock.Date === 'function';
        if (isMockTimers) {
          jest.runOnlyPendingTimers();
          jest.useRealTimers();
        }
        await waitFor(() => {
          if (prevError === error && ret.result.current === previousCurrent) {
            throw new Error('timeout in waitForNextUpdate');
          }
        }, options);
        if (isMockTimers) jest.useFakeTimers();
      },
    },
  });

  return ret;
}
