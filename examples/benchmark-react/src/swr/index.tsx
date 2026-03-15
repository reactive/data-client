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
import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { List } from 'react-window';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

/** SWR fetcher: dispatches to shared resource fetch methods based on cache key */
const fetcher = (key: string): Promise<any> => {
  if (key.startsWith('item:')) return ItemResource.get({ id: key.slice(5) });
  if (key.startsWith('author:'))
    return AuthorResource.get({ id: key.slice(7) });
  if (key === 'items:all') return ItemResource.getList();
  if (key.startsWith('items:'))
    return ItemResource.getList({ count: Number(key.slice(6)) });
  return Promise.reject(new Error(`Unknown key: ${key}`));
};

function SortedListView() {
  const { data: items } = useSWR<Item[]>('items:all', fetcher);
  const sorted = useMemo(() => (items ? sortByLabel(items) : []), [items]);
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
  const { data: items } = useSWR<Item[]>(`items:${count}`, fetcher);
  if (!items) return null;
  setCurrentItems(items);
  return (
    <List
      style={LIST_STYLE}
      rowHeight={ITEM_HEIGHT}
      rowCount={items.length}
      rowComponent={ItemsRow}
      rowProps={{ items }}
    />
  );
}

function BenchmarkHarness() {
  const { mutate } = useSWRConfig();
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
      measureUpdate(() =>
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () => mutate(`items:${listViewCount}`),
        ),
      );
    },
    [measureUpdate, mutate, listViewCount],
  );

  const updateAuthor = useCallback(
    (authorId: string) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdate(
        () =>
          AuthorResource.update(
            { id: authorId },
            { name: `${author.name} (updated)` },
          ).then(() => mutate(`items:${listViewCount}`)) as Promise<any>,
      );
    },
    [measureUpdate, mutate, listViewCount],
  );

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() =>
      ItemResource.create({ label: 'New Item', author }).then(() =>
        mutate(`items:${listViewCount}`),
      ),
    );
  }, [measureUpdate, mutate, listViewCount]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() =>
        ItemResource.delete({ id }).then(() =>
          mutate(`items:${listViewCount}`),
        ),
      );
    },
    [measureUpdate, mutate, listViewCount],
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
  <SWRConfig
    value={{
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }}
  >
    <React.Profiler id="bench" onRender={onProfilerRender}>
      <BenchmarkHarness />
    </React.Profiler>
  </SWRConfig>,
);
