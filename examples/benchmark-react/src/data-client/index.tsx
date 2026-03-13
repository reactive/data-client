import {
  DataProvider,
  useCache,
  useController,
  useQuery,
} from '@data-client/react';
import { mockInitialState } from '@data-client/react/mock';
import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ITEM_HEIGHT, ItemRow, LIST_STYLE } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  generateFreshData,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import { seedBulkItems } from '@shared/server';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { List, type RowComponentProps } from 'react-window';

import {
  createItemEndpoint,
  deleteItemEndpoint,
  getAuthor,
  getItem,
  getItemList,
  sortedItemsQuery,
  updateAuthorEndpoint,
  updateItemEndpoint,
  updateItemOptimistic,
} from './resources';

const initialState = mockInitialState([
  { endpoint: getItemList, args: [], response: FIXTURE_ITEMS },
  ...FIXTURE_ITEMS.map(item => ({
    endpoint: getItem,
    args: [{ id: item.id }] as [{ id: string }],
    response: item,
  })),
  ...[...FIXTURE_AUTHORS_BY_ID.values()].map(author => ({
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

function ListViewRow({
  index,
  style,
  items,
}: RowComponentProps<{ items: Item[] }>) {
  return (
    <div style={style}>
      <ItemRow item={items[index]} />
    </div>
  );
}

/** Renders items from the list endpoint (models rendering a list fetch response). */
function ListView() {
  const items = useCache(getItemList);
  if (!items) return null;
  const list = items as Item[];
  return (
    <List
      style={LIST_STYLE}
      rowHeight={ITEM_HEIGHT}
      rowCount={list.length}
      rowComponent={ListViewRow}
      rowProps={{ items: list }}
    />
  );
}

function SortedRow({
  index,
  style,
  items,
}: RowComponentProps<{ items: Item[] }>) {
  return (
    <div style={style}>
      <ItemRow item={items[index]} />
    </div>
  );
}

/** Renders items sorted by label via Query schema (memoized by MemoCache). */
function SortedListView({ count }: { count?: number }) {
  const items = useQuery(sortedItemsQuery, { limit: count });
  if (!items) return null;
  return (
    <div data-sorted-list>
      <List
        style={LIST_STYLE}
        rowHeight={ITEM_HEIGHT}
        rowCount={items.length}
        rowComponent={SortedRow}
        rowProps={{ items: items as Item[] }}
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
  const controller = useController();
  const {
    ids,
    showSortedView,
    sortedViewCount,
    containerRef,
    measureMount,
    measureUpdate,
    measureUpdateWithDelay,
    setIds,
    setShowSortedView,
    setSortedViewCount,
    unmountAll: unmountBase,
    registerAPI,
  } = useBenchState();
  const [showListView, setShowListView] = useState(false);

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        controller.fetch(updateItemEndpoint, {
          id,
          label: `${item.label} (updated)`,
        });
      });
    },
    [measureUpdate, controller],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdateWithDelay(options, () => {
        controller.fetch(updateAuthorEndpoint, {
          id: authorId,
          name: `${author.name} (updated)`,
        });
      });
    },
    [measureUpdateWithDelay, controller],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      controller
        .fetch(createItemEndpoint, {
          label: 'New Item',
          author,
        })
        .then((created: any) => {
          setIds(prev => [...prev, created.id]);
        });
    });
  }, [measureUpdate, controller, setIds]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        controller.fetch(deleteItemEndpoint, { id }).then(() => {
          setIds(prev => prev.filter(i => i !== id));
        });
      });
    },
    [measureUpdate, controller, setIds],
  );

  const unmountAll = useCallback(() => {
    unmountBase();
    setShowListView(false);
  }, [unmountBase]);

  const optimisticUpdate = useCallback(() => {
    const item = FIXTURE_ITEMS[0];
    if (!item) return;
    measureUpdate(() => {
      controller.fetch(updateItemOptimistic, {
        id: item.id,
        label: `${item.label} (optimistic)`,
      });
    });
  }, [measureUpdate, controller]);

  const bulkIngest = useCallback(
    (n: number) => {
      const { items } = generateFreshData(n);
      seedBulkItems(items);
      measureMount(() => {
        controller.fetch(getItemList).then(() => {
          setShowListView(true);
        });
      });
    },
    [measureMount, controller],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      measureMount(() => {
        setSortedViewCount(n);
        setShowSortedView(true);
      });
    },
    [measureMount, setSortedViewCount, setShowSortedView],
  );

  const invalidateAndResolve = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        controller.invalidate(getItem, { id });
        controller.fetch(getItem, { id });
      });
    },
    [measureUpdate, controller],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    unmountAll,
    optimisticUpdate,
    bulkIngest,
    mountSortedView,
    invalidateAndResolve,
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
      {showListView && <ListView />}
      {showSortedView && <SortedListView count={sortedViewCount} />}
    </div>
  );
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <DataProvider initialState={initialState}>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </DataProvider>,
);
