import { type ReactNode, use, useEffect, useMemo, useState } from 'react';

import type { Exchange } from './network';
import { compileExchanges, runExchanges } from './runExchanges';
import type { CodeDocument } from '../../editor/codeModel';
import type { FixtureOrInterceptor } from '../../types';

/** Hands `children` the exchange the code's last endpoint call makes,
 * rerun as the code changes (`../../../HTTP` draws it). It starts from
 * `initial`, the first exchange the page's HTML holds, or else runs the code
 * first (suspending). */
export default function LiveExchange({
  documents,
  initial,
  fixtures,
  getInitialInterceptorData,
  children,
}: Props) {
  return children(
    useLiveExchange(documents, initial, fixtures, getInitialInterceptorData),
  );
}

/** The exchange the page's own code makes as it first runs, the same
 * promise for the same code (as `use()` needs) */
export function firstExchange(
  documents: readonly CodeDocument[],
  fixtures: readonly FixtureOrInterceptor[] = NO_FIXTURES,
  getInitialInterceptorData?: () => unknown,
): Promise<LiveState> {
  return firstRun(compile(documents), fixtures, getInitialInterceptorData);
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
  initialState: LiveState | undefined,
  fixtures: readonly FixtureOrInterceptor[] = NO_FIXTURES,
  getInitialInterceptorData?: () => unknown,
): LiveState {
  const program = useMemo(() => compile(documents), [documents]);
  const [first] = useState(program);
  const initial =
    initialState ?? use(firstRun(first, fixtures, getInitialInterceptorData));
  const [state, setState] = useState(initial);

  useEffect(() => {
    if (program === first) {
      setState(initial);
      return;
    }
    const fail = (error: unknown) =>
      setState(last => ({ ...last, stale: true, error: `${error}` }));
    // half typed, or no call: the last exchange stays, dimmed
    const keepLast = () =>
      setState(last => ({ ...last, stale: true, error: undefined }));
    if (program === undefined) return keepLast();

    let current = true;
    let threw = false;
    let lastCall: Promise<Exchange> | undefined;
    // shown as the code's last call: one it makes later (after an await)
    // takes over; every call is handled, so a superseded failure is dropped.
    // A throw outlasts the call's answer.
    const show = (call: Promise<Exchange>) => {
      lastCall = call;
      call.then(
        exchange =>
          current &&
          !threw &&
          call === lastCall &&
          setState({ exchange, stale: false }),
        error => current && !threw && call === lastCall && fail(error),
      );
    };
    // dimmed until this run's call is answered
    setState(last => (last.stale ? last : { ...last, stale: true }));
    try {
      runExchanges(program, fixtures, show, getInitialInterceptorData);
    } catch (error) {
      threw = true;
      fail(error);
    }
    if (!lastCall && !threw) keepLast();
    return () => {
      current = false;
    };
  }, [program, first, initial, fixtures, getInitialInterceptorData]);

  return state;
}

/** A compile error is a half-typed edit: it keeps the last exchange */
function compile(documents: readonly CodeDocument[]) {
  try {
    return compileExchanges(documents);
  } catch {
    return undefined;
  }
}

function firstRun(
  program: string | undefined,
  fixtures: readonly FixtureOrInterceptor[],
  getInitialInterceptorData?: () => unknown,
): Promise<LiveState> {
  let runs = FIRST_RUNS.get(fixtures);
  if (!runs) FIRST_RUNS.set(fixtures, (runs = new Map()));
  let run = runs.get(program);
  if (!run) {
    run = settle(program, fixtures, getInitialInterceptorData);
    runs.set(program, run);
  }
  return run;
}

const FIRST_RUNS = new WeakMap<
  readonly FixtureOrInterceptor[],
  Map<string | undefined, Promise<LiveState>>
>();

/** The first paint's exchange: the last call the code makes as it first
 * runs (a call made later, after an await, shows once the code is edited) */
async function settle(
  program: string | undefined,
  fixtures: readonly FixtureOrInterceptor[],
  getInitialInterceptorData?: () => unknown,
): Promise<LiveState> {
  if (program === undefined) return { stale: false };
  let lastCall: Promise<Exchange> | undefined;
  try {
    // throws before awaiting, so a throw wins over an answer, as when live
    runExchanges(
      program,
      fixtures,
      call => {
        lastCall = call;
        // only the last call's failure is shown
        call.catch(() => undefined);
      },
      getInitialInterceptorData,
    );
    return { exchange: await lastCall, stale: false };
  } catch (error) {
    return { stale: false, error: `${error}` };
  }
}

/** Stable, so the exchange reruns only as the code changes */
const NO_FIXTURES: readonly FixtureOrInterceptor[] = [];

export interface LiveProps {
  /** Answer the code's requests; without them it shows the request alone */
  fixtures?: FixtureOrInterceptor[];
  /** `this` of the fixtures' interceptors, fresh each run */
  getInitialInterceptorData?: () => unknown;
}

interface Props extends LiveProps {
  documents: readonly CodeDocument[];
  initial?: LiveState;
  children: (state: LiveState) => ReactNode;
}
