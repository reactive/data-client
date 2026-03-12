import { useCallback, useEffect, useRef, useState } from 'react';

import { FIXTURE_ITEMS } from './data';
import { captureSnapshot, getReport } from './refStability';
import type { BenchAPI, UpdateAuthorOptions } from './types';

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
 * Standard BenchAPI actions (mount, unmountAll, mountUnmountCycle,
 * getRenderedCount, captureRefSnapshot, getRefStabilityReport) are provided
 * as defaults via `registerAPI`. Libraries only need to supply their
 * specific actions and any overrides.
 *
 * `registerAPI` uses a Proxy so adding new BenchAPI methods never requires
 * updating dependency arrays or registration boilerplate.
 */
export function useBenchState() {
  const [ids, setIds] = useState<string[]>([]);
  const [showSortedView, setShowSortedView] = useState(false);
  const [sortedViewCount, setSortedViewCount] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const completeResolveRef = useRef<(() => void) | null>(null);
  const apiRef = useRef<BenchAPI>(null as any);

  const setComplete = useCallback(() => {
    completeResolveRef.current?.();
    completeResolveRef.current = null;
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

  const measureMount = useCallback(
    (fn: () => void) => {
      performance.mark('mount-start');
      fn();
      afterPaint(() => {
        performance.mark('mount-end');
        performance.measure('mount-duration', 'mount-start', 'mount-end');
        setComplete();
      });
    },
    [setComplete],
  );

  const measureUpdate = useCallback(
    (fn: () => void) => {
      performance.mark('update-start');
      fn();
      afterPaint(() => {
        performance.mark('update-end');
        performance.measure('update-duration', 'update-start', 'update-end');
        setComplete();
      });
    },
    [setComplete],
  );

  /** Like measureUpdate, but marks start before the delay and runs fn after it. */
  const measureUpdateWithDelay = useCallback(
    (options: UpdateAuthorOptions | undefined, fn: () => void) => {
      performance.mark('update-start');
      const delayMs = options?.simulateNetworkDelayMs ?? 0;
      const requestCount = options?.simulatedRequestCount ?? 1;
      const totalDelayMs = delayMs * requestCount;

      const doUpdate = () => {
        fn();
        afterPaint(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      };

      if (totalDelayMs > 0) {
        setTimeout(doUpdate, totalDelayMs);
      } else {
        doUpdate();
      }
    },
    [setComplete],
  );

  const mount = useCallback(
    (n: number) => {
      const slicedIds = FIXTURE_ITEMS.slice(0, n).map(i => i.id);
      measureMount(() => setIds(slicedIds));
    },
    [measureMount],
  );

  const unmountAll = useCallback(() => {
    setIds([]);
    setShowSortedView(false);
    setSortedViewCount(undefined);
  }, []);

  const mountUnmountCycle = useCallback(
    async (n: number, cycles: number) => {
      for (let i = 0; i < cycles; i++) {
        const p = new Promise<void>(r => {
          completeResolveRef.current = r;
        });
        mount(n);
        await p;
        unmountAll();
        await waitForPaint();
      }
      setComplete();
    },
    [mount, unmountAll, setComplete],
  );

  const getRenderedCount = useCallback(() => ids.length, [ids]);
  const captureRefSnapshot = useCallback(() => captureSnapshot(), []);
  const getRefStabilityReport = useCallback(() => getReport(), []);

  /**
   * Register the BenchAPI on window.__BENCH__ with standard actions as defaults.
   * Call during render (after defining library-specific actions).
   * Libraries only pass their own actions + any overrides; standard actions
   * (mount, unmountAll, etc.) are included automatically.
   */
  const registerAPI = (libraryActions: LibraryActions) => {
    apiRef.current = {
      mount,
      unmountAll,
      mountUnmountCycle,
      getRenderedCount,
      captureRefSnapshot,
      getRefStabilityReport,
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
    ids,
    showSortedView,
    sortedViewCount,
    containerRef,

    measureMount,
    measureUpdate,
    measureUpdateWithDelay,
    setComplete,
    completeResolveRef,

    setIds,
    setShowSortedView,
    setSortedViewCount,

    mount,
    unmountAll,
    registerAPI,
  };
}
