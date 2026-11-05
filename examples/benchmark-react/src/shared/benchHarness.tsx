import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { FIXTURE_ISSUES } from './data';
import { captureSnapshot, getReport } from './refStability';
import { getRenderCounts, resetRenderCounts } from './renderCounts';
import {
  checkIssueListJSON,
  flushPendingMutations,
  holdMutationReplies,
  releaseMutationReplies,
  seedIssueList,
  setNetworkDelay,
  setNetworkSim,
} from './server';
import type { BenchAPI } from './types';

export function afterPaint(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function waitForPaint(): Promise<void> {
  return new Promise<void>(r => afterPaint(r));
}

export function onProfilerRender(
  _id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
) {
  performance.measure(`react-commit-${phase}`, {
    start: performance.now() - actualDuration,
    duration: actualDuration,
  });
}

const OBSERVE_MUTATIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
};

/**
 * Time from right before `fn()` until the first DOM mutation in `container`
 * for which `isReady()` holds. React commits atomically, so for an update the
 * first mutation is its commit. Calls `onEnd(start, end)` from that
 * MutationObserver callback. The observer is attached before the start time
 * is read, so attaching it is not timed, and the end time is read before
 * `isReady()` runs. If `fn()` throws, the observer is disconnected and the
 * error is rethrown.
 */
function timeToMutation<T>(
  container: Element,
  fn: () => T,
  onEnd: (start: number, end: number) => void,
  isReady?: () => boolean,
): { result: T; start: number; cancel: () => void } {
  const observer = new MutationObserver(() => {
    const end = performance.now();
    if (isReady && !isReady()) return;
    observer.disconnect();
    onEnd(start, end);
  });
  observer.observe(container, OBSERVE_MUTATIONS);
  const start = performance.now();
  let result: T;
  try {
    result = fn();
  } catch (err) {
    observer.disconnect();
    throw err;
  }
  return { result, start, cancel: () => observer.disconnect() };
}

/** How long the harness waits for a window to end before giving up. */
const HARNESS_TIMEOUT_MS = 30000;

/**
 * `timeToMutation` that gives up after `HARNESS_TIMEOUT_MS`: it then sets
 * data-bench-timeout and calls `onTimeout(start)` instead of `onEnd`.
 */
function timedWindow(
  container: Element,
  fn: () => unknown,
  isReady: (() => boolean) | undefined,
  onEnd: (start: number, end: number) => void,
  onTimeout: (start: number) => void,
): void {
  // Replaced by timeToMutation's values once it returns.
  let start = performance.now();
  let cancel: (() => void) | undefined;
  const timer = setTimeout(() => {
    cancel?.();
    container.setAttribute('data-bench-timeout', 'true');
    onTimeout(start);
  }, HARNESS_TIMEOUT_MS);
  try {
    ({ start, cancel } = timeToMutation(
      container,
      fn,
      (from, to) => {
        clearTimeout(timer);
        onEnd(from, to);
      },
      isReady,
    ));
  } catch (err) {
    // Else the timer completes a later iteration on this page.
    clearTimeout(timer);
    throw err;
  }
}

/** Check whether an issue has moved to the target state list and left the source. */
export function moveItemIsReady(
  containerRef: React.RefObject<HTMLDivElement | null>,
  number: number,
  targetState: 'open' | 'closed' = 'closed',
): boolean {
  const sourceState = targetState === 'closed' ? 'open' : 'closed';
  const source = containerRef.current?.querySelector(
    `[data-state-list="${sourceState}"]`,
  );
  const dest = containerRef.current?.querySelector(
    `[data-state-list="${targetState}"]`,
  );
  return (
    source?.querySelector(`[data-issue-number="${number}"]`) == null &&
    dest?.querySelector(`[data-issue-number="${number}"]`) != null
  );
}

/**
 * Actions that each library must provide (not supplied by the shared harness).
 * All other BenchAPI methods can be optionally overridden or added.
 */
type LibraryActions = Pick<BenchAPI, 'updateEntity' | 'updateUser'> &
  Partial<Omit<BenchAPI, 'updateEntity' | 'updateUser'>>;

/**
 * Shared benchmark harness state, measurement helpers, and API registration.
 *
 * Standard BenchAPI actions (init, unmountAll, mountUnmountCycle,
 * getRenderedCount, captureRefSnapshot, getRefStabilityReport,
 * resetRenderCounts, getRenderCounts) are provided
 * as defaults via `registerAPI`. Libraries only need to supply their
 * specific actions and any overrides.
 *
 * `registerAPI` uses a Proxy so adding new BenchAPI methods never requires
 * updating dependency arrays or registration boilerplate.
 */
export function useBenchState({
  optimisticMutations = false,
}: {
  /**
   * The library commits every `measureUpdate` mutation before the server
   * replies. The worker then holds mutation replies until the window ends;
   * otherwise a reply that wins the race to the main thread is processed
   * inside the window. Never set this for a library whose update windows wait
   * for a mutation reply: they would time out.
   */
  optimisticMutations?: boolean;
} = {}) {
  const [listViewCount, setListViewCount] = useState<number | undefined>();
  const [showSortedView, setShowSortedView] = useState(false);
  const [sortedViewCount, setSortedViewCount] = useState<number | undefined>();
  const [showDoubleList, setShowDoubleList] = useState(false);
  const [doubleListCount, setDoubleListCount] = useState<number | undefined>();
  const [detailIssueNumber, setDetailIssueNumber] = useState<number | null>(
    null,
  );
  const [pinnedNumbers, setPinnedNumbers] = useState<number[]>([]);
  const [renderLimit, setRenderLimit] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const completeResolveRef = useRef<(() => void) | null>(null);
  const completeWaiterRef = useRef<(() => void) | null>(null);
  const apiRef = useRef<BenchAPI>(null as any);

  const setComplete = useCallback(() => {
    completeResolveRef.current?.();
    completeResolveRef.current = null;
    completeWaiterRef.current?.();
    completeWaiterRef.current = null;
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

  const whenComplete = useCallback(
    () =>
      new Promise<void>(resolve => {
        completeWaiterRef.current = resolve;
      }),
    [],
  );

  /**
   * Measure a mount action via MutationObserver. Ends when expected content
   * ([data-bench-item] or [data-sorted-list]) appears in the container,
   * skipping intermediate states like Suspense fallbacks or empty first renders.
   *
   * Returns a promise that resolves when the mount content is detected.
   * Pass `signalComplete: false` to suppress the data-bench-complete attribute
   * (useful when the caller needs additional async work before signaling).
   */
  const measureMount = useCallback(
    (fn: () => unknown, { signalComplete = true } = {}): Promise<void> => {
      const container = containerRef.current!;
      return new Promise<void>(resolve => {
        const done = (start: number, end: number) => {
          performance.measure('mount-duration', { start, end });
          if (signalComplete) setComplete();
          resolve();
        };
        timedWindow(
          container,
          fn,
          () =>
            container.querySelector('[data-bench-item], [data-sorted-list]') !=
            null,
          done,
          start => done(start, performance.now()),
        );
      });
    },
    [setComplete],
  );

  /**
   * Measure an update action via MutationObserver. Ends on the first DOM
   * mutation in the container — React commits atomically so the first
   * mutation batch IS the final state for updates.
   *
   * For multi-phase scenarios like invalidateAndResolve (issues disappear
   * then reappear), pass an `isReady` predicate to wait for the final state.
   */
  const measureUpdate = useCallback(
    (fn: () => unknown, isReady?: () => boolean) => {
      const container = containerRef.current!;
      const done = (start: number, end: number) => {
        performance.measure('update-duration', { start, end });
        if (optimisticMutations) releaseMutationReplies();
        setComplete();
      };
      if (optimisticMutations) holdMutationReplies();
      try {
        timedWindow(container, fn, isReady, done, start =>
          done(start, performance.now()),
        );
      } catch (err) {
        if (optimisticMutations) releaseMutationReplies();
        throw err;
      }
    },
    [setComplete, optimisticMutations],
  );

  /**
   * Send `count` messages, each in its own task like websocket messages, and
   * time each one like `measureUpdate`: from right before `send(i)` until the
   * first DOM mutation in the container, which is the message's commit. So
   * React's passive-effect scheduling is not timed. Records one
   * `stream-message` measure per message; the runner aggregates them.
   *
   * `send(i)` applies message i. A library port must make it return a promise
   * that resolves after that update has committed (data-client's
   * `controller.set()` resolves from its store effect). The next message is
   * posted through a `MessageChannel` only after that promise resolves, so
   * React cannot merge messages, and the wait and the time between messages
   * are not timed. Every message must change the DOM. Build all message data
   * before calling this.
   *
   * Sets data-bench-complete when done, and also data-bench-timeout if the
   * stream takes more than 30 s.
   */
  const measureMessageStream = useCallback(
    (count: number, send: (i: number) => Promise<unknown>): Promise<void> => {
      const container = containerRef.current!;
      return new Promise<void>((resolve, reject) => {
        const { port1, port2 } = new MessageChannel();
        let cancelMessage: (() => void) | undefined;
        const stop = () => {
          clearTimeout(timer);
          cancelMessage?.();
          port1.close();
        };
        const timer = setTimeout(() => {
          stop();
          container.setAttribute('data-bench-timeout', 'true');
          setComplete();
          resolve();
        }, HARNESS_TIMEOUT_MS);
        port1.onmessage = async (e: MessageEvent<number>) => {
          const i = e.data;
          try {
            let end: number | undefined;
            const message = timeToMutation(
              container,
              () => send(i),
              (_, commitTime) => {
                end = commitTime;
              },
            );
            cancelMessage = message.cancel;
            await message.result;
            if (end === undefined)
              throw new Error(`message ${i} changed no DOM`);
            performance.measure('stream-message', {
              start: message.start,
              end,
            });
          } catch (err) {
            stop();
            reject(err);
            return;
          }
          if (i + 1 < count) {
            port2.postMessage(i + 1);
            return;
          }
          stop();
          setComplete();
          resolve();
        };
        port2.postMessage(0);
      });
    },
    [setComplete],
  );

  /**
   * Wait for an element matching `selector` to appear in the container.
   * Resolves immediately if already present; otherwise observes mutations.
   */
  const waitForElement = useCallback((selector: string) => {
    const container = containerRef.current!;
    if (container.querySelector(selector)) return Promise.resolve();
    return new Promise<void>(resolve => {
      const observer = new MutationObserver(() => {
        if (container.querySelector(selector)) {
          observer.disconnect();
          clearTimeout(timer);
          resolve();
        }
      });
      observer.observe(container, OBSERVE_MUTATIONS);
      const timer = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, HARNESS_TIMEOUT_MS);
    });
  }, []);

  const init = useCallback(
    (n: number) => {
      measureMount(() => {
        setListViewCount(n);
      });
    },
    [measureMount],
  );

  const unmountAll = useCallback(() => {
    setListViewCount(undefined);
    setShowSortedView(false);
    setSortedViewCount(undefined);
    setShowDoubleList(false);
    setDoubleListCount(undefined);
    setDetailIssueNumber(null);
    setPinnedNumbers([]);
  }, []);

  const initDoubleList = useCallback(
    (n: number) => {
      measureMount(() => {
        setDoubleListCount(n);
        setShowDoubleList(true);
      });
    },
    [measureMount],
  );

  const mountUnmountCycle = useCallback(
    async (n: number, cycles: number) => {
      for (let i = 0; i < cycles; i++) {
        const p = new Promise<void>(r => {
          completeResolveRef.current = r;
        });
        init(n);
        await p;
        apiRef.current?.unmountAll?.();
        await waitForPaint();
      }
      setComplete();
    },
    [init, setComplete],
  );

  const mountSortedView = useCallback(
    async (n: number) => {
      await seedIssueList(FIXTURE_ISSUES.slice(0, n));
      measureMount(() => {
        setSortedViewCount(n);
        setShowSortedView(true);
      });
    },
    [measureMount, setSortedViewCount, setShowSortedView],
  );

  /**
   * Time one navigation step: from right before `fn()` until a commit shows
   * `selector`, skipping earlier commits such as a loading state. Records one
   * `nav-step` measure.
   */
  const measureNavStep = useCallback((fn: () => void, selector: string) => {
    const container = containerRef.current!;
    return new Promise<void>(resolve => {
      timedWindow(
        container,
        fn,
        () => container.querySelector(selector) != null,
        (start, end) => {
          performance.measure('nav-step', { start, end });
          resolve();
        },
        () => resolve(),
      );
    });
  }, []);

  /**
   * Timed: each step from its state change until the next view commits,
   * summed by the runner. The time between steps (the observer callback and
   * any frame) is not timed.
   */
  const listDetailSwitch = useCallback(
    async (navigations: number, seedCount: number) => {
      await seedIssueList(FIXTURE_ISSUES.slice(0, seedCount));
      setSortedViewCount(seedCount);
      setShowSortedView(true);
      await waitForElement('[data-sorted-list]');

      // Warmup cycle (unmeasured) — exercises the detail mount path
      setShowSortedView(false);
      setDetailIssueNumber(1);
      await waitForElement('[data-detail-view]');
      setDetailIssueNumber(null);
      setShowSortedView(true);
      await waitForElement('[data-sorted-list]');

      const container = containerRef.current!;
      for (let i = 0; i < navigations; i++) {
        await measureNavStep(() => {
          setShowSortedView(false);
          setDetailIssueNumber(i + 2);
        }, '[data-detail-view]');
        await measureNavStep(() => {
          setDetailIssueNumber(null);
          setShowSortedView(true);
        }, '[data-sorted-list]');
        if (container.hasAttribute('data-bench-timeout')) break;
      }
      setComplete();
    },
    [
      setSortedViewCount,
      setShowSortedView,
      setDetailIssueNumber,
      waitForElement,
      measureNavStep,
      setComplete,
    ],
  );

  const initMultiView = useCallback(
    async (n: number) => {
      await seedIssueList(FIXTURE_ISSUES.slice(0, n));

      setDetailIssueNumber(1);
      setPinnedNumbers(Array.from({ length: 10 }, (_, i) => i + 1));

      await measureMount(() => setListViewCount(n), {
        signalComplete: false,
      });

      await waitForElement('[data-detail-view]');
      await waitForElement('[data-pinned-number]');
      setComplete();
    },
    [
      measureMount,
      setListViewCount,
      setDetailIssueNumber,
      setPinnedNumbers,
      waitForElement,
      setComplete,
    ],
  );

  const getRenderedCount = useCallback(
    () => listViewCount ?? 0,
    [listViewCount],
  );
  const captureRefSnapshot = useCallback(() => captureSnapshot(), []);
  const getRefStabilityReport = useCallback(() => getReport(), []);

  /**
   * Register the BenchAPI on window.__BENCH__ with standard actions as defaults.
   * Call during render (after defining library-specific actions).
   * Libraries only pass their own actions + any overrides; standard actions
   * (init, unmountAll, etc.) are included automatically.
   */
  const resetStoreNoop = useCallback(() => {}, []);

  const registerAPI = (libraryActions: LibraryActions) => {
    apiRef.current = {
      init,
      initDoubleList,
      initMultiView,
      unmountAll,
      mountUnmountCycle,
      mountSortedView,
      listDetailSwitch,
      getRenderedCount,
      captureRefSnapshot,
      getRefStabilityReport,
      resetRenderCounts,
      getRenderCounts,
      setNetworkDelay,
      setNetworkSim,
      flushPendingMutations,
      setRenderLimit,
      whenComplete,
      checkIssueListJSON,
      resetStore: resetStoreNoop,
      ...libraryActions,
    } as BenchAPI;
  };

  useEffect(() => {
    window.__BENCH__ = new Proxy({} as BenchAPI, {
      get(_, prop) {
        return (apiRef.current as any)?.[prop];
      },
    });
    document.body.setAttribute('data-app-ready', 'true');
    return () => {
      delete window.__BENCH__;
    };
  }, []);

  return {
    listViewCount,
    showSortedView,
    sortedViewCount,
    showDoubleList,
    doubleListCount,
    detailIssueNumber,
    pinnedNumbers,
    renderLimit,
    containerRef,

    measureMount,
    measureUpdate,
    measureMessageStream,
    waitForElement,
    setComplete,
    completeResolveRef,

    setListViewCount,
    setShowSortedView,
    setSortedViewCount,
    setShowDoubleList,
    setDoubleListCount,
    setDetailIssueNumber,

    unmountAll,
    registerAPI,
  };
}

export function renderBenchApp(
  Harness: React.ComponentType,
  Wrapper?: React.ComponentType<{ children: React.ReactNode }>,
) {
  const rootEl = document.getElementById('root') ?? document.body;
  const inner = (
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <Harness />
    </React.Profiler>
  );
  createRoot(rootEl).render(Wrapper ? <Wrapper>{inner}</Wrapper> : inner);
}
