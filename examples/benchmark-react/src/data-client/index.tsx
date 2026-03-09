import {
  DataProvider,
  useCache,
  useController,
  useQuery,
} from '@data-client/react';
import { mockInitialState } from '@data-client/react/mock';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_ITEMS,
  generateFreshData,
} from '@shared/data';
import { captureSnapshot, getReport, registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  getAuthor,
  getItem,
  getItemList,
  sortedItemsQuery,
  updateItemOptimistic,
} from './resources';

const initialState = mockInitialState([
  { endpoint: getItemList, args: [], response: FIXTURE_ITEMS },
  ...FIXTURE_ITEMS.map(item => ({
    endpoint: getItem,
    args: [{ id: item.id }] as [{ id: string }],
    response: item,
  })),
  ...FIXTURE_AUTHORS.map(author => ({
    endpoint: getAuthor,
    args: [{ id: author.id }] as [{ id: string }],
    response: author,
  })),
]);

function ItemView({ id }: { id: string }) {
  const item = useCache(getItem, { id });
  if (!item) return null;
  registerRefs(id, item as Item, item.author as Item['author']);
  return <ItemRow item={item as Item} />;
}

/** Renders items sorted by label via Query schema (memoized by MemoCache). */
function SortedListView() {
  const items = useQuery(sortedItemsQuery);
  if (!items) return null;
  return (
    <div data-sorted-list>
      {items.map((item: any) => (
        <ItemRow key={item.id} item={item as Item} />
      ))}
    </div>
  );
}

function BenchmarkHarness() {
  const [ids, setIds] = useState<string[]>([]);
  const [showSortedView, setShowSortedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const completeResolveRef = useRef<(() => void) | null>(null);
  const controller = useController();

  const setComplete = useCallback(() => {
    completeResolveRef.current?.();
    completeResolveRef.current = null;
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

  const mount = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      setIds(FIXTURE_ITEMS.slice(0, n).map(i => i.id));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [setComplete],
  );

  const updateEntity = useCallback(
    (id: string) => {
      performance.mark('update-start');
      const item = FIXTURE_ITEMS.find(i => i.id === id);
      if (item) {
        controller.setResponse(
          getItem,
          { id },
          {
            ...item,
            label: `${item.label} (updated)`,
          },
        );
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      });
    },
    [controller, setComplete],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      performance.mark('update-start');
      const delayMs = options?.simulateNetworkDelayMs ?? 0;
      const requestCount = options?.simulatedRequestCount ?? 1;
      const totalDelayMs = delayMs * requestCount;

      const doUpdate = () => {
        const author = FIXTURE_AUTHORS.find(a => a.id === authorId);
        if (author) {
          controller.setResponse(
            getAuthor,
            { id: authorId },
            {
              ...author,
              name: `${author.name} (updated)`,
            },
          );
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            performance.mark('update-end');
            performance.measure(
              'update-duration',
              'update-start',
              'update-end',
            );
            setComplete();
          });
        });
      };

      if (totalDelayMs > 0) {
        setTimeout(doUpdate, totalDelayMs);
      } else {
        doUpdate();
      }
    },
    [controller, setComplete],
  );

  const unmountAll = useCallback(() => {
    setIds([]);
  }, []);

  const optimisticUpdate = useCallback(() => {
    const item = FIXTURE_ITEMS[0];
    if (!item) return;
    performance.mark('update-start');
    controller.fetch(updateItemOptimistic, {
      id: item.id,
      label: `${item.label} (optimistic)`,
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark('update-end');
        performance.measure('update-duration', 'update-start', 'update-end');
        setComplete();
      });
    });
  }, [controller, setComplete]);

  const bulkIngest = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      const { items, authors } = generateFreshData(n);
      controller.setResponse(getItemList, items);
      for (const item of items) {
        controller.setResponse(getItem, { id: item.id }, item);
      }
      for (const author of authors) {
        controller.setResponse(getAuthor, { id: author.id }, author);
      }
      setIds(items.map(i => i.id));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [controller, setComplete],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      for (const item of FIXTURE_ITEMS.slice(0, n)) {
        controller.setResponse(getItem, { id: item.id }, item);
      }
      for (const author of FIXTURE_AUTHORS) {
        controller.setResponse(getAuthor, { id: author.id }, author);
      }
      setShowSortedView(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [controller, setComplete],
  );

  const invalidateAndResolve = useCallback(
    (id: string) => {
      performance.mark('update-start');
      const item = FIXTURE_ITEMS.find(i => i.id === id);
      if (item) {
        controller.invalidate(getItem, { id });
        controller.setResponse(
          getItem,
          { id },
          {
            ...item,
            label: `${item.label} (resolved)`,
          },
        );
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      });
    },
    [controller, setComplete],
  );

  const mountUnmountCycle = useCallback(
    async (n: number, cycles: number) => {
      for (let i = 0; i < cycles; i++) {
        const p = new Promise<void>(r => {
          completeResolveRef.current = r;
        });
        mount(n);
        await p;
        unmountAll();
        await new Promise<void>(r =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
      }
      setComplete();
    },
    [mount, unmountAll, setComplete],
  );

  const getRenderedCount = useCallback(() => ids.length, [ids]);

  const captureRefSnapshot = useCallback(() => {
    captureSnapshot();
  }, []);

  const getRefStabilityReport = useCallback(() => getReport(), []);

  useEffect(() => {
    window.__BENCH__ = {
      mount,
      updateEntity,
      updateAuthor,
      unmountAll,
      getRenderedCount,
      captureRefSnapshot,
      getRefStabilityReport,
      mountUnmountCycle,
      optimisticUpdate,
      bulkIngest,
      mountSortedView,
      invalidateAndResolve,
    };
    return () => {
      delete window.__BENCH__;
    };
  }, [
    mount,
    updateEntity,
    updateAuthor,
    unmountAll,
    mountUnmountCycle,
    optimisticUpdate,
    bulkIngest,
    mountSortedView,
    invalidateAndResolve,
    getRenderedCount,
    captureRefSnapshot,
    getRefStabilityReport,
  ]);

  useEffect(() => {
    document.body.setAttribute('data-app-ready', 'true');
  }, []);

  return (
    <div ref={containerRef} data-bench-harness>
      <div data-item-list>
        {ids.map(id => (
          <ItemView key={id} id={id} />
        ))}
      </div>
      {showSortedView && <SortedListView />}
    </div>
  );
}

function onProfilerRender(
  _id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
) {
  performance.measure(`react-commit-${phase}`, {
    start: performance.now() - actualDuration,
    duration: actualDuration,
  });
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <DataProvider initialState={initialState}>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </DataProvider>,
);
