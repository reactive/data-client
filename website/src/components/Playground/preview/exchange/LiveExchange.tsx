import { type ReactNode, useEffect, useMemo, useState } from 'react';

import type { Exchange } from './network';
import { compileExchanges, runExchanges } from './runExchanges';
import type { LiveProps } from '../../../HTTP/EndpointPlayground';
import type { CodeDocument } from '../../editor/codeModel';
import type { FixtureOrInterceptor } from '../../types';

/** Hands `children` the exchange the code's last endpoint call makes,
 * rerun as the code changes (`../../../HTTP` draws it) */
export default function LiveExchange({
  documents,
  fixtures,
  getInitialInterceptorData,
  children,
}: Props) {
  return children(
    useLiveExchange(documents, fixtures, getInitialInterceptorData),
  );
}

/** While an edit makes no request (half typed, or no call), the last
 * exchange stays, stale; an edit that fails as it runs has an error */
export interface LiveState {
  exchange?: Exchange;
  /** The code no longer makes `exchange` */
  stale: boolean;
  /** What the code threw as it ran, or as its last call built its request */
  error?: string;
}

function useLiveExchange(
  documents: readonly CodeDocument[],
  fixtures: readonly FixtureOrInterceptor[] = NO_FIXTURES,
  getInitialInterceptorData?: () => unknown,
): LiveState {
  const [state, setState] = useState<LiveState>({ stale: false });
  // a compile error is a half-typed edit: it keeps the last exchange
  const program = useMemo(() => {
    try {
      return compileExchanges(documents);
    } catch {
      return undefined;
    }
  }, [documents]);

  useEffect(() => {
    const fail = (error?: unknown) =>
      setState(last => ({
        ...last,
        stale: true,
        error: error === undefined ? undefined : `${error}`,
      }));
    let lastCall: Promise<Exchange> | undefined;
    try {
      lastCall =
        program === undefined ? undefined : (
          runExchanges(program, fixtures, getInitialInterceptorData).at(-1)
        );
    } catch (error) {
      return fail(error);
    }
    if (!lastCall) return fail();
    let current = true;
    lastCall.then(
      exchange => current && setState({ exchange, stale: false }),
      error => current && fail(error),
    );
    return () => {
      current = false;
    };
  }, [program, fixtures, getInitialInterceptorData]);

  return state;
}

/** Stable, so the exchange reruns only as the code changes */
const NO_FIXTURES: readonly FixtureOrInterceptor[] = [];

interface Props extends LiveProps {
  documents: readonly CodeDocument[];
  children: (state: LiveState) => ReactNode;
}
