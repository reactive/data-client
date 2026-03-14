import {
  AsyncBoundary,
  DataProvider,
  useController,
  useQuery,
  useSuspense,
} from '@data-client/react';
import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ITEM_HEIGHT, ItemsRow, LIST_STYLE } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
} from '@shared/data';
import { setCurrentItems } from '@shared/refStability';
import {
  AuthorResource,
  ItemResource,
  sortedItemsQuery,
} from '@shared/resources';
import type { Item } from '@shared/types';
import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { List } from 'react-window';

/** Renders items from the list endpoint (models rendering a list fetch response). */
function ListView({ count }: { count: number }) {
  const items = useSuspense(ItemResource.getList, { count });
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
        rowComponent={ItemsRow}
        rowProps={{ items: items as Item[] }}
      />
    </div>
  );
}

function BenchmarkHarness() {
  const controller = useController();
  const {
    listViewCount,
    showSortedView,
    sortedViewCount,
    containerRef,
    measureUpdate,
    measureMount,
    setShowSortedView,
    setSortedViewCount,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        controller.fetch(
          ItemResource.update,
          { id },
          { label: `${item.label} (updated)` },
        );
      });
    },
    [measureUpdate, controller],
  );

  const updateAuthor = useCallback(
    (authorId: string) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdate(() => {
        controller.fetch(
          AuthorResource.update,
          { id: authorId },
          { name: `${author.name} (updated)` },
        );
      });
    },
    [measureUpdate, controller],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      controller.fetch(ItemResource.create, {
        label: 'New Item',
        author,
      });
    });
  }, [measureUpdate, controller]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        controller.fetch(ItemResource.delete, { id });
      });
    },
    [measureUpdate, controller],
  );

  const optimisticUpdate = useCallback(() => {
    const item = FIXTURE_ITEMS[0];
    if (!item) return;
    measureUpdate(() => {
      controller.fetch(
        ItemResource.update,
        { id: item.id },
        { label: `${item.label} (optimistic)` },
      );
    });
  }, [measureUpdate, controller]);

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
        controller.invalidate(ItemResource.get, { id });
      });
    },
    [measureUpdate, controller],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    optimisticUpdate,
    mountSortedView,
    invalidateAndResolve,
    createEntity,
    deleteEntity,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      <AsyncBoundary>
        {listViewCount != null && <ListView count={listViewCount} />}
        {showSortedView && <SortedListView count={sortedViewCount} />}
      </AsyncBoundary>
    </div>
  );
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <DataProvider>
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </DataProvider>,
);
