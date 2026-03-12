import {
  DataProvider,
  useCache,
  useController,
  useQuery,
} from '@data-client/react';
import { mockInitialState } from '@data-client/react/mock';
import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  generateFreshData,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  AuthorEntity,
  getAuthor,
  getItem,
  getItemList,
  ItemEntity,
  sortedItemsQuery,
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

/** Renders items from the list endpoint (models rendering a list fetch response). */
function ListView() {
  const items = useCache(getItemList);
  if (!items) return null;
  return (
    <>
      {(items as Item[]).map(item => (
        <ItemRow key={item.id} item={item} />
      ))}
    </>
  );
}

/** Renders items sorted by label via Query schema (memoized by MemoCache). */
function SortedListView({ count }: { count?: number }) {
  const items = useQuery(sortedItemsQuery, { limit: count });
  if (!items) return null;
  return (
    <div data-sorted-list>
      {items.map((item: any) => (
        <ItemRow key={item.id} item={item as Item} />
      ))}
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
        controller.set(
          ItemEntity,
          { id },
          { ...item, label: `${item.label} (updated)` },
        );
      });
    },
    [measureUpdate, controller],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdateWithDelay(options, () => {
        controller.set(
          AuthorEntity,
          { id: authorId },
          { ...author, name: `${author.name} (updated)` },
        );
      });
    },
    [measureUpdateWithDelay, controller],
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
      measureMount(() => {
        controller.setResponse(getItemList, items);
        setShowListView(true);
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
        controller.setResponse(
          getItem,
          { id },
          { ...item, label: `${item.label} (resolved)` },
        );
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
  });

  return (
    <div ref={containerRef} data-bench-harness>
      <div data-item-list>
        {ids.map(id => (
          <ItemView key={id} id={id} />
        ))}
      </div>
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
