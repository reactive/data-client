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
import type { Item, UpdateAuthorOptions } from '@shared/types';
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
  const { items } = useContext(ItemsContext);
  const sorted = useMemo(() => sortByLabel(items), [items]);
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

function BenchmarkHarness() {
  const [items, setItems] = useState<Item[]>([]);
  const {
    listViewCount,
    showSortedView,
    containerRef,
    measureMount,
    measureUpdate,
    measureUpdateWithDelay,
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

  const unmountAll = useCallback(() => {
    unmountBase();
    setItems([]);
  }, [unmountBase]);

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        ItemResource.update({ id }, { label: `${item.label} (updated)` }).then(
          () => {
            ItemResource.getList({ count: listViewCount! }).then(setItems);
          },
        );
      });
    },
    [measureUpdate, listViewCount],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdateWithDelay(options, () => {
        AuthorResource.update(
          { id: authorId },
          { name: `${author.name} (updated)` },
        ).then(() => {
          ItemResource.getList({ count: listViewCount! }).then(setItems);
        });
      });
    },
    [measureUpdateWithDelay, listViewCount],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      ItemResource.create({ label: 'New Item', author }).then(() => {
        ItemResource.getList({ count: listViewCount! }).then(setItems);
      });
    });
  }, [measureUpdate, listViewCount]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        ItemResource.delete({ id }).then(() => {
          ItemResource.getList({ count: listViewCount! }).then(setItems);
        });
      });
    },
    [measureUpdate, listViewCount],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        ItemResource.getList().then(fetched => {
          setItems(fetched);
          setShowSortedView(true);
        });
      });
    },
    [measureMount, setShowSortedView],
  );

  registerAPI({
    updateEntity,
    updateAuthor,
    unmountAll,
    mountSortedView,
    createEntity,
    deleteEntity,
  });

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      <div ref={containerRef} data-bench-harness>
        {listViewCount != null && <ListView />}
        {showSortedView && <SortedListView />}
      </div>
    </ItemsContext.Provider>
  );
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <React.Profiler id="bench" onRender={onProfilerRender}>
    <BenchmarkHarness />
  </React.Profiler>,
);
