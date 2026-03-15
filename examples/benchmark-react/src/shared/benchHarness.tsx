import { useCallback, useEffect, useRef, useState } from 'react';

import { captureSnapshot, getReport } from './refStability';
import { setNetworkDelay } from './server';
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

/**
 * Actions that each library must provide (not supplied by the shared harness).
 * All other BenchAPI methods can be optionally overridden or added.
 */
type LibraryActions = Pick<BenchAPI, 'updateEntity' | 'updateAuthor'> &
  Partial<Omit<BenchAPI, 'updateEntity' | 'updateAuthor'>>;

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
  const [showTripleList, setShowTripleList] = useState(false);
  const [tripleListCount, setTripleListCount] = useState<number | undefined>();
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
   */
  const measureMount = useCallback(
    (fn: () => unknown) => {
      const container = containerRef.current!;
      const observer = new MutationObserver(() => {
        if (container.querySelector('[data-bench-item], [data-sorted-list]')) {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          observer.disconnect();
          clearTimeout(timer);
          setComplete();
        }
      });
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      const timer = setTimeout(() => {
        observer.disconnect();
        setComplete();
      }, 30000);
      performance.mark('mount-start');
      fn();
    },
    [setComplete],
  );

  /**
   * Measure an update action via MutationObserver. Ends on the first DOM
   * mutation in the container — React commits atomically so the first
   * mutation batch IS the final state for updates.
   *
   * For multi-phase scenarios like invalidateAndResolve (items disappear
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
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      const timer = setTimeout(() => {
        observer.disconnect();
        setComplete();
      }, 30000);
      performance.mark('update-start');
      fn();
    },
    [setComplete],
  );

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
    setShowTripleList(false);
    setTripleListCount(undefined);
  }, []);

  const initTripleList = useCallback(
    (n: number) => {
      measureMount(() => {
        setTripleListCount(n);
        setShowTripleList(true);
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
        unmountAll();
        await waitForPaint();
      }
      setComplete();
    },
    [init, unmountAll, setComplete],
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
  const registerAPI = (libraryActions: LibraryActions) => {
    apiRef.current = {
      init,
      initTripleList,
      unmountAll,
      mountUnmountCycle,
      getRenderedCount,
      captureRefSnapshot,
      getRefStabilityReport,
      setNetworkDelay,
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
    showTripleList,
    tripleListCount,
    containerRef,

    measureMount,
    measureUpdate,
    setComplete,
    completeResolveRef,

    setListViewCount,
    setShowSortedView,
    setSortedViewCount,
    setShowTripleList,
    setTripleListCount,

    unmountAll,
    registerAPI,
  };
}
