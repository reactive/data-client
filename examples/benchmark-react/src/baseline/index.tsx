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
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { List } from 'react-window';

const ItemsContext = React.createContext<{
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}>(null as any);

function SortedListView() {
  const { items, setItems } = useContext(ItemsContext);
  useEffect(() => {
    ItemResource.getList().then(setItems);
  }, [setItems]);
  const sorted = useMemo(() => sortByLabel(items), [items]);
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

function ListView() {
  const { items } = useContext(ItemsContext);
  if (!items.length) return null;
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

const TripleListContext = React.createContext<{
  openItems: Item[];
  closedItems: Item[];
  inProgressItems: Item[];
  setOpenItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setClosedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setInProgressItems: React.Dispatch<React.SetStateAction<Item[]>>;
}>(null as any);

function TripleListView() {
  const { openItems, closedItems, inProgressItems } =
    useContext(TripleListContext);
  return (
    <div style={TRIPLE_LIST_STYLE}>
      {openItems.length > 0 && (
        <div data-status-list="open">
          <span data-status-count>{openItems.length}</span>
          <PlainItemList items={openItems} />
        </div>
      )}
      {closedItems.length > 0 && (
        <div data-status-list="closed">
          <span data-status-count>{closedItems.length}</span>
          <PlainItemList items={closedItems} />
        </div>
      )}
      {inProgressItems.length > 0 && (
        <div data-status-list="in_progress">
          <span data-status-count>{inProgressItems.length}</span>
          <PlainItemList items={inProgressItems} />
        </div>
      )}
    </div>
  );
}

function DetailView({ id }: { id: string }) {
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => {
    ItemResource.get({ id }).then(setItem);
  }, [id]);
  if (!item) return null;
  return (
    <div data-detail-view data-item-id={id}>
      <ItemRow item={item} />
    </div>
  );
}

function BenchmarkHarness() {
  const [items, setItems] = useState<Item[]>([]);
  const [openItems, setOpenItems] = useState<Item[]>([]);
  const [closedItems, setClosedItems] = useState<Item[]>([]);
  const [inProgressItems, setInProgressItems] = useState<Item[]>([]);
  const {
    listViewCount,
    showSortedView,
    showTripleList,
    tripleListCount,
    detailItemId,
    containerRef,
    measureUpdate,
    unmountAll: unmountBase,
    registerAPI,
  } = useBenchState();

  // Fetch items when listViewCount changes (populates context for ListView)
  useEffect(() => {
    if (listViewCount != null) {
      ItemResource.getList({ count: listViewCount }).then(setItems);
    }
  }, [listViewCount]);

  useEffect(() => {
    if (showTripleList && tripleListCount != null) {
      ItemResource.getList({ status: 'open', count: tripleListCount }).then(
        setOpenItems,
      );
      ItemResource.getList({ status: 'closed', count: tripleListCount }).then(
        setClosedItems,
      );
      ItemResource.getList({
        status: 'in_progress',
        count: tripleListCount,
      }).then(setInProgressItems);
    }
  }, [showTripleList, tripleListCount]);

  const unmountAll = useCallback(() => {
    unmountBase();
    setItems([]);
    setOpenItems([]);
    setClosedItems([]);
    setInProgressItems([]);
  }, [unmountBase]);

  const refetchActiveList = useCallback(() => {
    if (tripleListCount != null) {
      return Promise.all([
        ItemResource.getList({ status: 'open', count: tripleListCount }).then(
          setOpenItems,
        ),
        ItemResource.getList({
          status: 'closed',
          count: tripleListCount,
        }).then(setClosedItems),
        ItemResource.getList({
          status: 'in_progress',
          count: tripleListCount,
        }).then(setInProgressItems),
      ]);
    }
    return ItemResource.getList({ count: listViewCount! }).then(setItems);
  }, [listViewCount, tripleListCount]);

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() =>
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          refetchActiveList,
        ),
      );
    },
    [measureUpdate, refetchActiveList],
  );

  const updateAuthor = useCallback(
    (authorId: string) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdate(() =>
        AuthorResource.update(
          { id: authorId },
          { name: `${author.name} (updated)` },
        ).then(refetchActiveList),
      );
    },
    [measureUpdate, refetchActiveList],
  );

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() =>
      ItemResource.create({ label: 'New Item', author }).then(
        refetchActiveList,
      ),
    );
  }, [measureUpdate, refetchActiveList]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => ItemResource.delete({ id }).then(refetchActiveList));
    },
    [measureUpdate, refetchActiveList],
  );

  const moveItem = useCallback(
    (id: string) => {
      measureUpdate(
        () =>
          ItemResource.update({ id }, { status: 'closed' }).then(() =>
            Promise.all([
              ItemResource.getList({
                status: 'open',
                count: tripleListCount!,
              }).then(setOpenItems),
              ItemResource.getList({
                status: 'closed',
                count: tripleListCount!,
              }).then(setClosedItems),
              ItemResource.getList({
                status: 'in_progress',
                count: tripleListCount!,
              }).then(setInProgressItems),
            ]),
          ),
        () => moveItemIsReady(containerRef, id),
      );
    },
    [measureUpdate, tripleListCount, containerRef],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    unmountAll,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      <TripleListContext.Provider
        value={{
          openItems,
          closedItems,
          inProgressItems,
          setOpenItems,
          setClosedItems,
          setInProgressItems,
        }}
      >
        <div ref={containerRef} data-bench-harness>
          {listViewCount != null && <ListView />}
          {showSortedView && <SortedListView />}
          {showTripleList && tripleListCount != null && <TripleListView />}
          {detailItemId != null && <DetailView id={detailItemId} />}
        </div>
      </TripleListContext.Provider>
    </ItemsContext.Provider>
  );
}

renderBenchApp(BenchmarkHarness);
