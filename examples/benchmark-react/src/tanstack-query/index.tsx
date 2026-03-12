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
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
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
    queryFn: () => FIXTURE_ITEMS_BY_ID.get(id) as Item,
    initialData: () =>
      (FIXTURE_ITEMS_BY_ID.get(id) ??
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
  const client = useQueryClient();
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
        client.setQueryData(['item', id], {
          ...item,
          label: `${item.label} (updated)`,
        });
      });
    },
    [measureUpdate, client],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      const newAuthor = { ...author, name: `${author.name} (updated)` };
      measureUpdateWithDelay(options, () => {
        client.setQueryData(['author', authorId], newAuthor);
        for (const item of FIXTURE_ITEMS) {
          if (item.author.id === authorId) {
            client.setQueryData(['item', item.id], (old: Item | undefined) =>
              old ? { ...old, author: newAuthor } : old,
            );
          }
        }
      });
    },
    [measureUpdateWithDelay, client],
  );

  const bulkIngest = useCallback(
    (n: number) => {
      const { items, authors } = generateFreshData(n);
      measureMount(() => {
        for (const author of authors) {
          client.setQueryData(['author', author.id], author);
        }
        for (const item of items) {
          client.setQueryData(['item', item.id], item);
        }
        setIds(items.map(i => i.id));
      });
    },
    [measureMount, setIds, client],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      measureMount(() => {
        client.setQueryData(['items', 'all'], FIXTURE_ITEMS.slice(0, n));
        setShowSortedView(true);
      });
    },
    [measureMount, setShowSortedView, client],
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
  <QueryClientProvider client={queryClient}>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </QueryClientProvider>,
);
