import {
  DataProvider,
  useController,
  useDLE,
  useSuspense,
} from '@data-client/react';
import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import {
  TRIPLE_LIST_STYLE,
  ITEM_HEIGHT,
  ItemRow,
  ItemsRow,
  LIST_STYLE,
  PlainItemList,
} from '@shared/components';
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
  sortedItemsEndpoint,
} from '@shared/resources';
import { getItem, patchItem, seedItemList } from '@shared/server';
import type { Item } from '@shared/types';
import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { List } from 'react-window';

/** Renders items from the list endpoint (models rendering a list fetch response). */
function ListView({ count }: { count: number }) {
  const { data: items } = useDLE(ItemResource.getList, { count });
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
function SortedListView({ count }: { count: number }) {
  const { data: items } = useDLE(sortedItemsEndpoint, { count });
  if (!items?.length) return null;
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

function StatusListView({ status, count }: { status: string; count: number }) {
  const { data: items } = useDLE(ItemResource.getList, { status, count });
  if (!items) return null;
  const list = items as Item[];
  return (
    <div data-status-list={status}>
      <span data-status-count>{list.length}</span>
      <PlainItemList items={list} />
    </div>
  );
}

function TripleListView({ count }: { count: number }) {
  return (
    <div style={TRIPLE_LIST_STYLE}>
      <StatusListView status="open" count={count} />
      <StatusListView status="closed" count={count} />
      <StatusListView status="in_progress" count={count} />
    </div>
  );
}

function DetailView({ id }: { id: string }) {
  const item = useSuspense(ItemResource.get, { id });
  return (
    <div data-detail-view data-item-id={id}>
      <ItemRow item={item as Item} />
    </div>
  );
}

function BenchmarkHarness() {
  const controller = useController();
  const {
    listViewCount,
    showSortedView,
    sortedViewCount,
    showTripleList,
    tripleListCount,
    detailItemId,
    containerRef,
    measureUpdate,
    measureMount,
    waitForElement,
    setComplete,
    setShowSortedView,
    setSortedViewCount,
    setDetailItemId,
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

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      (controller.fetch as any)(
        ItemResource.create,
        { status: 'open' },
        {
          label: 'New Item',
          author,
        },
      );
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

  const moveItem = useCallback(
    (id: string) => {
      measureUpdate(
        () => {
          controller.fetch(ItemResource.move, { id }, { status: 'closed' });
        },
        () => {
          const source = containerRef.current?.querySelector(
            '[data-status-list="open"]',
          );
          const dest = containerRef.current?.querySelector(
            '[data-status-list="closed"]',
          );
          return (
            source?.querySelector(`[data-item-id="${id}"]`) == null &&
            dest?.querySelector(`[data-item-id="${id}"]`) != null
          );
        },
      );
    },
    [measureUpdate, controller, containerRef],
  );

  const mountSortedView = useCallback(
    async (n: number) => {
      await seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        setSortedViewCount(n);
        setShowSortedView(true);
      });
    },
    [measureMount, setSortedViewCount, setShowSortedView],
  );

  const listDetailSwitch = useCallback(
    async (n: number) => {
      await seedItemList(FIXTURE_ITEMS.slice(0, n));
      setSortedViewCount(n);
      setShowSortedView(true);
      await waitForElement('[data-sorted-list]');

      // Warmup cycle (unmeasured) — exercises the detail mount path
      setShowSortedView(false);
      setDetailItemId('item-0');
      await waitForElement('[data-detail-view]');
      setDetailItemId(null);
      setShowSortedView(true);
      await waitForElement('[data-sorted-list]');

      performance.mark('mount-start');
      for (let i = 1; i <= 10; i++) {
        setShowSortedView(false);
        setDetailItemId(`item-${i}`);
        await waitForElement('[data-detail-view]');

        setDetailItemId(null);
        setShowSortedView(true);
        await waitForElement('[data-sorted-list]');
      }
      performance.mark('mount-end');
      performance.measure('mount-duration', 'mount-start', 'mount-end');
      setComplete();
    },
    [
      setSortedViewCount,
      setShowSortedView,
      setDetailItemId,
      waitForElement,
      setComplete,
    ],
  );

  const invalidateAndResolve = useCallback(
    async (id: string) => {
      const item = await getItem(id);
      if (item) {
        await patchItem(id, { label: `${item.label} (refetched)` });
      }
      measureUpdate(
        () => {
          if (tripleListCount != null) {
            controller.invalidate(ItemResource.getList, {
              status: 'open',
              count: tripleListCount,
            });
          } else {
            controller.invalidate(ItemResource.getList, {
              count: listViewCount!,
            });
          }
        },
        () => {
          const el = containerRef.current!.querySelector(
            `[data-item-id="${id}"] [data-label]`,
          );
          return el?.textContent?.includes('(refetched)') ?? false;
        },
      );
    },
    [measureUpdate, controller, containerRef, tripleListCount, listViewCount],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    mountSortedView,
    listDetailSwitch,
    invalidateAndResolve,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
      {showSortedView && sortedViewCount != null && (
        <SortedListView count={sortedViewCount} />
      )}
      {showTripleList && tripleListCount != null && (
        <TripleListView count={tripleListCount} />
      )}
      {detailItemId != null && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <DetailView id={detailItemId} />
        </React.Suspense>
      )}
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
