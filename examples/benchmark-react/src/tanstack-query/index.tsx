import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ITEM_HEIGHT, ItemRow, ItemsRow, LIST_STYLE } from '@shared/components';
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
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { List, type RowComponentProps } from 'react-window';

function queryFn({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> {
  const [type, id] = queryKey as string[];
  if (type === 'item' && id) return fetchItem({ id });
  if (type === 'author' && id) return fetchAuthor({ id });
  if (type === 'items') return fetchItemList();
  return Promise.reject(new Error(`Unknown queryKey: ${queryKey}`));
}

function seedCache(client: QueryClient) {
  for (const item of FIXTURE_ITEMS) {
    client.setQueryData(['item', item.id], item);
  }
  for (const author of FIXTURE_AUTHORS) {
    client.setQueryData(['author', author.id], author);
  }
  client.setQueryData(['items', 'all'], FIXTURE_ITEMS);
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
    queryFn,
  });
  if (!item) return null;
  const itemAsItem = item as Item;
  registerRefs(id, itemAsItem, itemAsItem.author);
  return <ItemRow item={itemAsItem} />;
}

function SortedListView() {
  const { data: items } = useQuery({
    queryKey: ['items', 'all'],
    queryFn,
  });
  const sorted = useMemo(
    () => (items ? sortByLabel(items as Item[]) : []),
    [items],
  );
  return (
    <div data-sorted-list>
      <List
        style={LIST_STYLE}
        rowHeight={ITEM_HEIGHT}
        rowCount={sorted.length}
        rowComponent={ItemsRow}
        rowProps={{ items: sorted }}
      />
    </div>
  );
}

function ItemListRow({
  index,
  style,
  ids,
}: RowComponentProps<{ ids: string[] }>) {
  return (
    <div style={style}>
      <ItemView id={ids[index]} />
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
        updateItem({ id, label: `${item.label} (updated)` }).then(data => {
          client.setQueryData(['item', id], data);
        });
      });
    },
    [measureUpdate, client],
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
          client.setQueryData(['author', authorId], updatedAuthor);
          for (const item of FIXTURE_ITEMS) {
            if (item.author.id === authorId) {
              client.refetchQueries({ queryKey: ['item', item.id] });
            }
          }
        });
      });
    },
    [measureUpdateWithDelay, client],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      createItem({ label: 'New Item', author }).then(created => {
        client.setQueryData(['item', created.id], created);
        void client.invalidateQueries({ queryKey: ['items', 'all'] });
        setIds(prev => [created.id, ...prev]);
      });
    });
  }, [measureUpdate, client, setIds]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        deleteItem({ id }).then(() => {
          client.removeQueries({ queryKey: ['item', id] });
          setIds(prev => prev.filter(i => i !== id));
        });
      });
    },
    [measureUpdate, client, setIds],
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
            client.setQueryData(['item', item.id], item);
            if (!seenAuthors.has(item.author.id)) {
              seenAuthors.add(item.author.id);
              client.setQueryData(['author', item.author.id], item.author);
            }
          }
          setIds(fetchedItems.map(i => i.id));
        });
      });
    },
    [measureMount, setIds, client],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        client
          .fetchQuery({ queryKey: ['items', 'all'], queryFn, staleTime: 0 })
          .then(() => {
            setShowSortedView(true);
          });
      });
    },
    [measureMount, setShowSortedView, client],
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
      <List
        style={LIST_STYLE}
        rowHeight={ITEM_HEIGHT}
        rowCount={ids.length}
        rowComponent={ItemListRow}
        rowProps={{ ids }}
      />
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
