import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { FIXTURE_ISSUES } from './data';
import { captureSnapshot, getReport } from './refStability';
import {
  flushPendingMutations,
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

/**
 * Deliver `count` messages, each in its own task like websocket messages, and
 * time each one. `send(i)` applies message i and returns a promise that
 * resolves when the update has settled. Each message's time runs from the
 * `send(i)` call until its commit changes the DOM in `container` (the
 * MutationObserver callback after the commit), so React's passive-effect
 * scheduling is not counted. Every message must change the DOM. The next
 * message is posted after the promise resolves, through a `MessageChannel`,
 * so React can't merge messages and the time between messages is not
 * counted. Prepare all message data before calling this.
 *
 * Records these `performance.measure` entries:
 * - `stream-message`: one per message.
 * - `update-duration`: the sum of the message times.
 * - `update-message-worst`: the longest message time.
 * - `update-message-p95`: the 95th-percentile message time (nearest rank).
 */
export function measureMessageStream(
  count: number,
  container: Element,
  send: (i: number) => Promise<unknown>,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const durations: number[] = [];
    let firstStart = 0;
    let start = -1;
    let end = -1;
    const observer = new MutationObserver(() => {
      if (start >= 0 && end < 0) end = performance.now();
    });
    observer.observe(container, OBSERVE_MUTATIONS);
    const { port1, port2 } = new MessageChannel();
    const fail = (err: unknown) => {
      observer.disconnect();
      port1.close();
      reject(err);
    };
    port1.onmessage = async (e: MessageEvent<number>) => {
      const i = e.data;
      try {
        end = -1;
        start = performance.now();
        await send(i);
        if (end < 0) throw new Error(`message ${i} changed no DOM`);
        if (i === 0) firstStart = start;
        durations.push(end - start);
        performance.measure('stream-message', { start, end });
        start = -1;
      } catch (err) {
        fail(err);
        return;
      }
      if (i + 1 < count) {
        port2.postMessage(i + 1);
        return;
      }
      observer.disconnect();
      port1.close();
      const sorted = [...durations].sort((a, b) => a - b);
      const record = (name: string, duration: number) =>
        performance.measure(name, { start: firstStart, duration });
      record(
        'update-duration',
        durations.reduce((a, b) => a + b, 0),
      );
      record('update-message-worst', sorted[sorted.length - 1]);
      record('update-message-p95', sorted[Math.ceil(sorted.length * 0.95) - 1]);
      resolve();
    };
    port2.postMessage(0);
  });
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
 * getRenderedCount, captureRefSnapshot, getRefStabilityReport) are provided
 * as defaults via `registerAPI`. Libraries only need to supply their
 * specific actions and any overrides.
 *
 * `registerAPI` uses a Proxy so adding new BenchAPI methods never requires
 * updating dependency arrays or registration boilerplate.
 */
export function useBenchState() {
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
  const apiRef = useRef<BenchAPI>(null as any);

  const setComplete = useCallback(() => {
    completeResolveRef.current?.();
    completeResolveRef.current = null;
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

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
        const done = () => {
          if (signalComplete) setComplete();
          resolve();
        };
        const observer = new MutationObserver(() => {
          if (
            container.querySelector('[data-bench-item], [data-sorted-list]')
          ) {
            performance.mark('mount-end');
            performance.measure('mount-duration', 'mount-start', 'mount-end');
            observer.disconnect();
            clearTimeout(timer);
            done();
          }
        });
        observer.observe(container, OBSERVE_MUTATIONS);
        const timer = setTimeout(() => {
          observer.disconnect();
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          container.setAttribute('data-bench-timeout', 'true');
          done();
        }, 30000);
        performance.mark('mount-start');
        fn();
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
      const observer = new MutationObserver(() => {
        if (!isReady || isReady()) {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          observer.disconnect();
          clearTimeout(timer);
          setComplete();
        }
      });
      observer.observe(container, OBSERVE_MUTATIONS);
      const timer = setTimeout(() => {
        observer.disconnect();
        performance.mark('update-end');
        performance.measure('update-duration', 'update-start', 'update-end');
        container.setAttribute('data-bench-timeout', 'true');
        setComplete();
      }, 30000);
      performance.mark('update-start');
      fn();
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
      }, 30000);
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

      performance.mark('mount-start');
      for (let i = 0; i < navigations; i++) {
        setShowSortedView(false);
        setDetailIssueNumber(i + 2);
        await waitForElement('[data-detail-view]');

        setDetailIssueNumber(null);
        setShowSortedView(true);
        await waitForElement('[data-sorted-list]');
      }
      performance.mark('mount-end');
      performance.measure('mount-duration', 'mount-start', 'mount-end');
      setComplete();
    },
    [
      setSortedViewCount,
      setShowSortedView,
      setDetailIssueNumber,
      waitForElement,
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
      setNetworkDelay,
      setNetworkSim,
      flushPendingMutations,
      setRenderLimit,
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
