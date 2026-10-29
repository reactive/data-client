import { type ReactNode, use, useEffect, useMemo, useState } from 'react';

import { compileExchanges, type LiveOutcome, runLive } from './runExchanges';
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
export interface LiveState extends LiveOutcome {
  /** The code no longer makes `exchange` */
  stale: boolean;
}

function useLiveExchange(
  documents: readonly CodeDocument[],
  initialState: LiveState | undefined,
  fixtures: readonly FixtureOrInterceptor[] = NO_FIXTURES,
  getInitialInterceptorData?: () => unknown,
): LiveState {
  // the page's own code, whose exchange is `initial`: it runs only if edited
  const [first] = useState(documents);
  const initial =
    initialState ??
    use(firstExchange(first, fixtures, getInitialInterceptorData));
  const [state, setState] = useState(initial);
  const edited = documents !== first;
  const program = useMemo(
    () => (edited ? compile(documents) : undefined),
    [edited, documents],
  );

  useEffect(() => {
    if (!edited) {
      setState(initial);
      return;
    }
    // half typed: the last exchange stays, dimmed
    if (program === undefined) {
      setState(last => ({ ...last, stale: true, error: undefined }));
      return;
    }
    // dimmed only while this run's call waits past the fixtures' microtasks
    const dim = setTimeout(() =>
      setState(last => (last.stale ? last : { ...last, stale: true })),
    );
    const stop = runLive(
      program,
      fixtures,
      getInitialInterceptorData,
      ({ exchange, error }) => {
        clearTimeout(dim);
        setState(last =>
          exchange ?
            { exchange, stale: false }
          : { ...last, stale: true, error },
        );
      },
    );
    return () => {
      clearTimeout(dim);
      stop();
    };
  }, [edited, program, initial, fixtures, getInitialInterceptorData]);

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

/** The first paint's exchange: the code's outcome once its calls are
 * answered. Fixtures answer within microtasks, so a macrotask with no new
 * report means the code has made its last call, as an edit would show. Code
 * that waits on a timer before a call shows the exchange before it. */
function settle(
  program: string | undefined,
  fixtures: readonly FixtureOrInterceptor[],
  getInitialInterceptorData?: () => unknown,
): Promise<LiveState> {
  if (program === undefined) return Promise.resolve({ stale: false });
  return new Promise(resolve => {
    let quiet: ReturnType<typeof setTimeout> | undefined;
    runLive(program, fixtures, getInitialInterceptorData, outcome => {
      clearTimeout(quiet);
      quiet = setTimeout(() => resolve({ ...outcome, stale: false }));
    });
  });
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
