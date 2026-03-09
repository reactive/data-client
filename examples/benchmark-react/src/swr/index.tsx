import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_ITEMS,
  generateFreshData,
} from '@shared/data';
import { captureSnapshot, getReport, registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

const fetcher = () => Promise.reject(new Error('Not implemented - use cache'));

const cache = new Map<
  string,
  { data: unknown; isLoading: boolean; isValidating: boolean; error: undefined }
>();
for (const author of FIXTURE_AUTHORS) {
  cache.set(`author:${author.id}`, {
    data: author,
    isLoading: false,
    isValidating: false,
    error: undefined,
  });
}
for (const item of FIXTURE_ITEMS) {
  cache.set(`item:${item.id}`, {
    data: item,
    isLoading: false,
    isValidating: false,
    error: undefined,
  });
}
cache.set('items:all', {
  data: FIXTURE_ITEMS,
  isLoading: false,
  isValidating: false,
  error: undefined,
});

function ItemView({ id }: { id: string }) {
  const { data: item } = useSWR<Item>(`item:${id}`, fetcher);
  if (!item) return null;
  registerRefs(id, item, item.author);
  return <ItemRow item={item} />;
}

function SortedListView() {
  const { data: items } = useSWR<Item[]>('items:all', fetcher);
  const sorted = useMemo(
    () =>
      items ? [...items].sort((a, b) => a.label.localeCompare(b.label)) : [],
    [items],
  );
  return (
    <div data-sorted-list>
      {sorted.map(item => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function BenchmarkHarness() {
  const [ids, setIds] = useState<string[]>([]);
  const [showSortedView, setShowSortedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const completeResolveRef = useRef<(() => void) | null>(null);
  const { mutate } = useSWRConfig();

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
        void mutate(`item:${id}`, {
          ...item,
          label: `${item.label} (updated)`,
        });
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      });
    },
    [mutate, setComplete],
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
          const newAuthor = {
            ...author,
            name: `${author.name} (updated)`,
          };
          void mutate(`author:${authorId}`, newAuthor);
          for (const item of FIXTURE_ITEMS) {
            if (item.author.id === authorId) {
              void mutate(`item:${item.id}`, (prev: Item | undefined) =>
                prev ? { ...prev, author: newAuthor } : prev,
              );
            }
          }
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
    [mutate, setComplete],
  );

  const unmountAll = useCallback(() => {
    setIds([]);
  }, []);

  const bulkIngest = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      const { items, authors } = generateFreshData(n);
      for (const author of authors) {
        cache.set(`author:${author.id}`, {
          data: author,
          isLoading: false,
          isValidating: false,
          error: undefined,
        });
      }
      for (const item of items) {
        cache.set(`item:${item.id}`, {
          data: item,
          isLoading: false,
          isValidating: false,
          error: undefined,
        });
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
    [setComplete],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      cache.set('items:all', {
        data: FIXTURE_ITEMS.slice(0, n),
        isLoading: false,
        isValidating: false,
        error: undefined,
      });
      setShowSortedView(true);
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
      bulkIngest,
      mountSortedView,
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
    bulkIngest,
    mountSortedView,
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
  <SWRConfig value={{ provider: () => cache as any }}>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </SWRConfig>,
);
