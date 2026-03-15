import { DataProvider, useController, useDLE } from '@data-client/react';
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
} from '@shared/data';
import { setCurrentItems } from '@shared/refStability';
import {
  AuthorResource,
  ItemResource,
  sortedItemsEndpoint,
} from '@shared/resources';
import { jsonStore, seedItemList } from '@shared/server';
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
  const controller = useController();
  const {
    listViewCount,
    showSortedView,
    sortedViewCount,
    showDualList,
    dualListCount,
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

  const unshiftItem = useCallback(() => {
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
          return source?.querySelector(`[data-item-id="${id}"]`) == null;
        },
      );
    },
    [measureUpdate, controller, containerRef],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        setSortedViewCount(n);
        setShowSortedView(true);
      });
    },
    [measureMount, setSortedViewCount, setShowSortedView],
  );

  const invalidateAndResolve = useCallback(
    (id: string) => {
      // Tweak server data so the refetch returns different content,
      // guaranteeing a visible DOM mutation for MutationObserver.
      const raw = jsonStore.get(`item:${id}`);
      if (raw) {
        const item: Item = JSON.parse(raw);
        item.label = `${item.label} (refetched)`;
        jsonStore.set(`item:${id}`, JSON.stringify(item));
      }
      measureUpdate(
        () => {
          controller.invalidate(ItemResource.getList, {
            count: listViewCount!,
          });
        },
        () => {
          const el = containerRef.current!.querySelector(
            `[data-item-id="${id}"] [data-label]`,
          );
          return el?.textContent?.includes('(refetched)') ?? false;
        },
      );
    },
    [measureUpdate, controller, containerRef, listViewCount],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    mountSortedView,
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
      {showDualList && dualListCount != null && (
        <DualListView count={dualListCount} />
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
