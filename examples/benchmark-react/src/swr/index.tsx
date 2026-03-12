import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  generateFreshData,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useMemo } from 'react';
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
  const { mutate } = useSWRConfig();
  const {
    ids,
    showSortedView,
    containerRef,
    measureMount,
    measureUpdate,
    measureUpdateWithDelay,
    setIds,
    setShowSortedView,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        void mutate(`item:${id}`, {
          ...item,
          label: `${item.label} (updated)`,
        });
      });
    },
    [measureUpdate, mutate],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      const newAuthor = { ...author, name: `${author.name} (updated)` };
      measureUpdateWithDelay(options, () => {
        void mutate(`author:${authorId}`, newAuthor);
        for (const item of FIXTURE_ITEMS) {
          if (item.author.id === authorId) {
            void mutate(`item:${item.id}`, (prev: Item | undefined) =>
              prev ? { ...prev, author: newAuthor } : prev,
            );
          }
        }
      });
    },
    [measureUpdateWithDelay, mutate],
  );

  const bulkIngest = useCallback(
    (n: number) => {
      const { items, authors } = generateFreshData(n);
      measureMount(() => {
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
      });
    },
    [measureMount, setIds],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      measureMount(() => {
        cache.set('items:all', {
          data: FIXTURE_ITEMS.slice(0, n),
          isLoading: false,
          isValidating: false,
          error: undefined,
        });
        setShowSortedView(true);
      });
    },
    [measureMount, setShowSortedView],
  );

  registerAPI({ updateEntity, updateAuthor, bulkIngest, mountSortedView });

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

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <SWRConfig
    value={{
      provider: () => cache as any,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    }}
  >
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </SWRConfig>,
);
