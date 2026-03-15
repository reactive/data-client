import { onProfilerRender, useBenchState } from '@shared/benchHarness';
import {
  TRIPLE_LIST_STYLE,
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
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
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
          <List
            style={LIST_STYLE}
            rowHeight={ITEM_HEIGHT}
            rowCount={openItems.length}
            rowComponent={ItemsRow}
            rowProps={{ items: openItems }}
          />
        </div>
      )}
      {closedItems.length > 0 && (
        <div data-status-list="closed">
          <List
            style={LIST_STYLE}
            rowHeight={ITEM_HEIGHT}
            rowCount={closedItems.length}
            rowComponent={ItemsRow}
            rowProps={{ items: closedItems }}
          />
        </div>
      )}
      {inProgressItems.length > 0 && (
        <div data-status-list="in_progress">
          <List
            style={LIST_STYLE}
            rowHeight={ITEM_HEIGHT}
            rowCount={inProgressItems.length}
            rowComponent={ItemsRow}
            rowProps={{ items: inProgressItems }}
          />
        </div>
      )}
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
    containerRef,
    measureMount,
    measureUpdate,
    setShowSortedView,
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

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() =>
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () => ItemResource.getList({ count: listViewCount! }).then(setItems),
        ),
      );
    },
    [measureUpdate, listViewCount],
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
          ItemResource.getList({ count: listViewCount! }).then(setItems),
        ),
      );
    },
    [measureUpdate, listViewCount],
  );

  const unshiftItem = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() =>
      ItemResource.create({ label: 'New Item', author }).then(() =>
        ItemResource.getList({ count: listViewCount! }).then(setItems),
      ),
    );
  }, [measureUpdate, listViewCount]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() =>
        ItemResource.delete({ id }).then(() =>
          ItemResource.getList({ count: listViewCount! }).then(setItems),
        ),
      );
    },
    [measureUpdate, listViewCount],
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
        () => {
          const source = containerRef.current?.querySelector(
            '[data-status-list="open"]',
          );
          return source?.querySelector(`[data-item-id="${id}"]`) == null;
        },
      );
    },
    [measureUpdate, tripleListCount, containerRef],
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
    unmountAll,
    mountSortedView,
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
        </div>
      </TripleListContext.Provider>
    </ItemsContext.Provider>
  );
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <React.Profiler id="bench" onRender={onProfilerRender}>
    <BenchmarkHarness />
  </React.Profiler>,
);
