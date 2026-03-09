import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_ITEMS,
  generateFreshData,
} from '@shared/data';
import { captureSnapshot, getReport, registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';

function seedCache(queryClient: QueryClient) {
  for (const author of FIXTURE_AUTHORS) {
    queryClient.setQueryData(['author', author.id], author);
  }
  for (const item of FIXTURE_ITEMS) {
    queryClient.setQueryData(['item', item.id], item);
  }
  queryClient.setQueryData(['items', 'all'], FIXTURE_ITEMS);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});
seedCache(queryClient);

function ItemView({ id }: { id: string }) {
  const { data: item } = useQuery({
    queryKey: ['item', id],
    queryFn: () => FIXTURE_ITEMS.find(i => i.id === id) as Item,
    initialData: () =>
      (FIXTURE_ITEMS.find(i => i.id === id) ??
        queryClient.getQueryData<Item>(['item', id])) as Item,
  });
  if (!item) return null;
  const itemAsItem = item as Item;
  registerRefs(id, itemAsItem, itemAsItem.author);
  return <ItemRow item={itemAsItem} />;
}

function SortedListView() {
  const { data: items } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => FIXTURE_ITEMS,
    initialData: () =>
      queryClient.getQueryData<Item[]>(['items', 'all']) ?? FIXTURE_ITEMS,
  });
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
  const client = useQueryClient();

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
        client.setQueryData(['item', id], {
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
    [client, setComplete],
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
          client.setQueryData(['author', authorId], newAuthor);
          for (const item of FIXTURE_ITEMS) {
            if (item.author.id === authorId) {
              client.setQueryData(['item', item.id], (old: Item | undefined) =>
                old ? { ...old, author: newAuthor } : old,
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
    [client, setComplete],
  );

  const unmountAll = useCallback(() => {
    setIds([]);
  }, []);

  const bulkIngest = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      const { items, authors } = generateFreshData(n);
      for (const author of authors) {
        client.setQueryData(['author', author.id], author);
      }
      for (const item of items) {
        client.setQueryData(['item', item.id], item);
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
    [client, setComplete],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      client.setQueryData(['items', 'all'], FIXTURE_ITEMS.slice(0, n));
      setShowSortedView(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [client, setComplete],
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
  <QueryClientProvider client={queryClient}>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </QueryClientProvider>,
);
