import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ITEM_HEIGHT, ItemsRow, LIST_STYLE } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  sortByLabel,
} from '@shared/data';
import { setCurrentItems } from '@shared/refStability';
import { AuthorResource, ItemResource } from '@shared/resources';
import { seedItemList } from '@shared/server';
import type { Item } from '@shared/types';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { List } from 'react-window';

function queryFn({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> {
  const [type, id] = queryKey as [string, string | number | undefined];
  if (type === 'item' && id) return ItemResource.get({ id: String(id) });
  if (type === 'author' && id) return AuthorResource.get({ id: String(id) });
  if (type === 'items' && typeof id === 'number')
    return ItemResource.getList({ count: id });
  if (type === 'items') return ItemResource.getList();
  return Promise.reject(new Error(`Unknown queryKey: ${queryKey}`));
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

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

function ListView({ count }: { count: number }) {
  const { data: items } = useQuery({
    queryKey: ['items', count],
    queryFn,
  });
  if (!items) return null;
  const list = items as Item[];
  setCurrentItems(list);
  return (
    <List
      style={LIST_STYLE}
      rowHeight={ITEM_HEIGHT}
      rowCount={list.length}
      rowComponent={ItemsRow}
      rowProps={{ items: list }}
    />
  );
}

function BenchmarkHarness() {
  const client = useQueryClient();
  const {
    listViewCount,
    showSortedView,
    containerRef,
    measureMount,
    measureUpdate,
    setShowSortedView,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () => {
            void client.invalidateQueries({
              queryKey: ['items', listViewCount],
            });
          },
        );
      });
    },
    [measureUpdate, client, listViewCount],
  );

  const updateAuthor = useCallback(
    (authorId: string) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdate(() =>
        AuthorResource.update(
          { id: authorId },
          { name: `${author.name} (updated)` },
        ).then(() =>
          client.invalidateQueries({
            queryKey: ['items', listViewCount],
          }),
        ),
      );
    },
    [measureUpdate, client, listViewCount],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      ItemResource.create({ label: 'New Item', author }).then(() => {
        void client.invalidateQueries({ queryKey: ['items', listViewCount] });
      });
    });
  }, [measureUpdate, client, listViewCount]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        ItemResource.delete({ id }).then(() => {
          void client.invalidateQueries({
            queryKey: ['items', listViewCount],
          });
        });
      });
    },
    [measureUpdate, client, listViewCount],
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
    mountSortedView,
    createEntity,
    deleteEntity,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
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
