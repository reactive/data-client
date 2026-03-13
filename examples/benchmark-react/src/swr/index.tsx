import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  generateFreshData,
  sortByLabel,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import {
  fetchItem,
  fetchAuthor,
  fetchItemList,
  createItem,
  updateItem,
  updateAuthor as serverUpdateAuthor,
  deleteItem,
  seedBulkItems,
  seedItemList,
} from '@shared/server';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

/** SWR fetcher: dispatches to shared server functions based on cache key */
const fetcher = (key: string): Promise<any> => {
  if (key.startsWith('item:')) return fetchItem({ id: key.slice(5) });
  if (key.startsWith('author:')) return fetchAuthor({ id: key.slice(7) });
  if (key === 'items:all') return fetchItemList();
  return Promise.reject(new Error(`Unknown key: ${key}`));
};

type CacheEntry = {
  data: unknown;
  isLoading: boolean;
  isValidating: boolean;
  error: undefined;
};

function makeCacheEntry(data: unknown): CacheEntry {
  return { data, isLoading: false, isValidating: false, error: undefined };
}

const cache = new Map<string, CacheEntry>();
for (const item of FIXTURE_ITEMS) {
  cache.set(`item:${item.id}`, makeCacheEntry(item));
}
for (const author of FIXTURE_AUTHORS) {
  cache.set(`author:${author.id}`, makeCacheEntry(author));
}
cache.set('items:all', makeCacheEntry(FIXTURE_ITEMS));

function ItemView({ id }: { id: string }) {
  const { data: item } = useSWR<Item>(`item:${id}`, fetcher);
  if (!item) return null;
  registerRefs(id, item, item.author);
  return <ItemRow item={item} />;
}

function SortedListView() {
  const { data: items } = useSWR<Item[]>('items:all', fetcher);
  const sorted = useMemo(() => (items ? sortByLabel(items) : []), [items]);
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
        updateItem({ id, label: `${item.label} (updated)` }).then(data => {
          void mutate(`item:${id}`, data, false);
        });
      });
    },
    [measureUpdate, mutate],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdateWithDelay(options, () => {
        serverUpdateAuthor({
          id: authorId,
          name: `${author.name} (updated)`,
        }).then(updatedAuthor => {
          void mutate(`author:${authorId}`, updatedAuthor, false);
          for (const item of FIXTURE_ITEMS) {
            if (item.author.id === authorId) {
              void mutate(`item:${item.id}`);
            }
          }
        });
      });
    },
    [measureUpdateWithDelay, mutate],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      createItem({ label: 'New Item', author }).then(created => {
        cache.set(`item:${created.id}`, makeCacheEntry(created));
        setIds(prev => [...prev, created.id]);
      });
    });
  }, [measureUpdate, setIds]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        deleteItem({ id }).then(() => {
          cache.delete(`item:${id}`);
          setIds(prev => prev.filter(i => i !== id));
        });
      });
    },
    [measureUpdate, setIds],
  );

  const bulkIngest = useCallback(
    (n: number) => {
      const { items } = generateFreshData(n);
      seedBulkItems(items);
      measureMount(() => {
        fetchItemList().then(parsed => {
          const fetchedItems = parsed as Item[];
          const seenAuthors = new Set<string>();
          for (const item of fetchedItems) {
            cache.set(`item:${item.id}`, makeCacheEntry(item));
            if (!seenAuthors.has(item.author.id)) {
              seenAuthors.add(item.author.id);
              cache.set(
                `author:${item.author.id}`,
                makeCacheEntry(item.author),
              );
            }
          }
          setIds(fetchedItems.map(i => i.id));
        });
      });
    },
    [measureMount, setIds],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        fetchItemList().then(parsed => {
          cache.set('items:all', makeCacheEntry(parsed));
          setShowSortedView(true);
        });
      });
    },
    [measureMount, setShowSortedView],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    bulkIngest,
    mountSortedView,
    createEntity,
    deleteEntity,
  });

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
