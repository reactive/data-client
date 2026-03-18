import {
  moveItemIsReady,
  renderBenchApp,
  useBenchState,
} from '@shared/benchHarness';
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
  FIXTURE_ITEMS_BY_ID,
  sortByLabel,
} from '@shared/data';
import { setCurrentItems } from '@shared/refStability';
import { AuthorResource, ItemResource } from '@shared/resources';
import type { Item } from '@shared/types';
import React, { useCallback, useMemo } from 'react';
import { List } from 'react-window';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

/** SWR fetcher: dispatches to shared resource fetch methods based on cache key */
const fetcher = (key: string): Promise<any> => {
  if (key.startsWith('item:')) return ItemResource.get({ id: key.slice(5) });
  if (key.startsWith('author:'))
    return AuthorResource.get({ id: key.slice(7) });
  if (key === 'items:all') return ItemResource.getList();
  if (key.startsWith('items:status:')) {
    const [status, count] = key.slice(13).split(':');
    return ItemResource.getList({
      status,
      ...(count ? { count: Number(count) } : {}),
    });
  }
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

function DetailView({ id }: { id: string }) {
  const { data: item } = useSWR<Item>(`item:${id}`, fetcher);
  if (!item) return null;
  return (
    <div data-detail-view data-item-id={id}>
      <ItemRow item={item} />
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

function StatusListView({ status, count }: { status: string; count: number }) {
  const { data: items } = useSWR<Item[]>(
    `items:status:${status}:${count}`,
    fetcher,
  );
  if (!items) return null;
  return (
    <div data-status-list={status}>
      <span data-status-count>{items.length}</span>
      <PlainItemList items={items} />
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

function BenchmarkHarness() {
  const { mutate } = useSWRConfig();
  const {
    listViewCount,
    showSortedView,
    showTripleList,
    tripleListCount,
    detailItemId,
    containerRef,
    measureUpdate,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() =>
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () =>
            mutate(key => typeof key === 'string' && key.startsWith('items:')),
        ),
      );
    },
    [measureUpdate, mutate],
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
          ).then(() =>
            mutate(key => typeof key === 'string' && key.startsWith('items:')),
          ) as Promise<any>,
      );
    },
    [measureUpdate, mutate],
  );

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() =>
      ItemResource.create({ label: 'New Item', author }).then(() =>
        mutate(key => typeof key === 'string' && key.startsWith('items:')),
      ),
    );
  }, [measureUpdate, mutate]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() =>
        ItemResource.delete({ id }).then(() =>
          mutate(key => typeof key === 'string' && key.startsWith('items:')),
        ),
      );
    },
    [measureUpdate, mutate],
  );

  const moveItem = useCallback(
    (id: string) => {
      measureUpdate(
        () =>
          ItemResource.update({ id }, { status: 'closed' }).then(() =>
            mutate(key => typeof key === 'string' && key.startsWith('items:')),
          ),
        () => moveItemIsReady(containerRef, id),
      );
    },
    [measureUpdate, mutate, containerRef],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
      {showSortedView && <SortedListView />}
      {showTripleList && tripleListCount != null && (
        <TripleListView count={tripleListCount} />
      )}
      {detailItemId != null && <DetailView id={detailItemId} />}
    </div>
  );
}

function BenchProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

renderBenchApp(BenchmarkHarness, BenchProvider);
