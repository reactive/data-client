import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import {
  DUAL_LIST_STYLE,
  ITEM_HEIGHT,
  ItemsRow,
  LIST_STYLE,
} from '@shared/components';
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
  if (type === 'items' && id && typeof id === 'object')
    return ItemResource.getList(id as { status?: string; count?: number });
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
  if (!sorted.length) return null;
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

function StatusListView({ status, count }: { status: string; count: number }) {
  const { data: items } = useQuery({
    queryKey: ['items', { status, count }],
    queryFn,
  });
  if (!items) return null;
  const list = items as Item[];
  return (
    <div data-status-list={status}>
      <List
        style={LIST_STYLE}
        rowHeight={ITEM_HEIGHT}
        rowCount={list.length}
        rowComponent={ItemsRow}
        rowProps={{ items: list }}
      />
    </div>
  );
}

function DualListView({ count }: { count: number }) {
  return (
    <div style={DUAL_LIST_STYLE}>
      <StatusListView status="open" count={count} />
      <StatusListView status="closed" count={count} />
    </div>
  );
}

function BenchmarkHarness() {
  const client = useQueryClient();
  const {
    listViewCount,
    showSortedView,
    showDualList,
    dualListCount,
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
      measureUpdate(() =>
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () =>
            client.invalidateQueries({
              queryKey: ['items'],
            }),
        ),
      );
    },
    [measureUpdate, client],
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
            queryKey: ['items'],
          }),
        ),
      );
    },
    [measureUpdate, client],
  );

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() =>
      ItemResource.create({ label: 'New Item', author }).then(() =>
        client.invalidateQueries({ queryKey: ['items'] }),
      ),
    );
  }, [measureUpdate, client]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() =>
        ItemResource.delete({ id }).then(() =>
          client.invalidateQueries({
            queryKey: ['items'],
          }),
        ),
      );
    },
    [measureUpdate, client],
  );

  const moveItem = useCallback(
    (id: string) => {
      measureUpdate(
        () =>
          ItemResource.update({ id }, { status: 'closed' }).then(() =>
            client.invalidateQueries({ queryKey: ['items'] }),
          ),
        () => {
          const source = containerRef.current?.querySelector(
            '[data-status-list="open"]',
          );
          return source?.querySelector(`[data-item-id="${id}"]`) == null;
        },
      );
    },
    [measureUpdate, client, containerRef],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        setShowSortedView(true);
      });
    },
    [measureMount, setShowSortedView],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    mountSortedView,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
      {showSortedView && <SortedListView />}
      {showDualList && dualListCount != null && (
        <DualListView count={dualListCount} />
      )}
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
