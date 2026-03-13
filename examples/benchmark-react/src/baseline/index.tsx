import {
  onProfilerRender,
  useBenchState,
  waitForPaint,
} from '@shared/benchHarness';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  FIXTURE_ITEMS_BY_ID,
  generateFreshData,
  sortByLabel,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import {
  fetchItemList,
  createItem,
  updateItem,
  updateAuthor as serverUpdateAuthor,
  deleteItem,
  seedBulkItems,
  seedItemList,
} from '@shared/server';
import type { Author, Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const ItemsContext = React.createContext<{
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}>(null as any);

function ItemView({ id }: { id: string }) {
  const { items } = useContext(ItemsContext);
  const item = items.find(i => i.id === id);
  if (!item) return null;
  registerRefs(id, item, item.author);
  return <ItemRow item={item} />;
}

function SortedListView() {
  const { items } = useContext(ItemsContext);
  const sorted = useMemo(() => sortByLabel(items), [items]);
  return (
    <div data-sorted-list>
      {sorted.map(item => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function BenchmarkHarness() {
  const [items, setItems] = useState<Item[]>([]);
  const {
    ids,
    showSortedView,
    containerRef,
    measureMount,
    measureUpdate,
    measureUpdateWithDelay,
    setComplete,
    completeResolveRef,
    setIds,
    setShowSortedView,
    unmountAll: unmountBase,
    registerAPI,
  } = useBenchState();

  const mount = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        fetchItemList().then(fetched => {
          setItems(fetched);
          setIds(fetched.map(i => i.id));
        });
      });
    },
    [measureMount, setIds],
  );

  const updateEntity = useCallback(
    (id: string) => {
      const item = FIXTURE_ITEMS_BY_ID.get(id);
      if (!item) return;
      measureUpdate(() => {
        updateItem({ id, label: `${item.label} (updated)` }).then(parsed => {
          setItems(prev => prev.map(i => (i.id === id ? parsed : i)));
        });
      });
    },
    [measureUpdate],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      measureUpdateWithDelay(options, () => {
        serverUpdateAuthor({
          id: authorId,
          name: `${author.name} (updated)`,
        }).then(parsed => {
          setItems(prev =>
            prev.map(item =>
              item.author.id === authorId ? { ...item, author: parsed } : item,
            ),
          );
        });
      });
    },
    [measureUpdateWithDelay],
  );

  const createEntity = useCallback(() => {
    const author = FIXTURE_AUTHORS[0];
    measureUpdate(() => {
      createItem({ label: 'New Item', author }).then(created => {
        setItems(prev => [...prev, created]);
        setIds(prev => [...prev, created.id]);
      });
    });
  }, [measureUpdate, setIds]);

  const deleteEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        deleteItem({ id }).then(() => {
          setItems(prev => prev.filter(i => i.id !== id));
          setIds(prev => prev.filter(i => i !== id));
        });
      });
    },
    [measureUpdate, setIds],
  );

  const unmountAll = useCallback(() => {
    unmountBase();
    setItems([]);
  }, [unmountBase]);

  const bulkIngest = useCallback(
    (n: number) => {
      const { items: freshItems } = generateFreshData(n);
      seedBulkItems(freshItems);
      measureMount(() => {
        fetchItemList().then(fetched => {
          setItems(fetched);
          setIds(fetched.map(i => i.id));
        });
      });
    },
    [measureMount, setIds],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      seedItemList(FIXTURE_ITEMS.slice(0, n));
      measureMount(() => {
        fetchItemList().then(fetched => {
          setItems(fetched);
          setShowSortedView(true);
        });
      });
    },
    [measureMount, setShowSortedView],
  );

  const mountUnmountCycle = useCallback(
    async (n: number, cycles: number) => {
      for (let i = 0; i < cycles; i++) {
        const p = new Promise<void>(r => {
          completeResolveRef.current = r;
        });
        mount(n);
        await p;
        unmountAll();
        await waitForPaint();
      }
      setComplete();
    },
    [mount, unmountAll, setComplete, completeResolveRef],
  );

  registerAPI({
    mount,
    updateEntity,
    updateAuthor,
    unmountAll,
    mountUnmountCycle,
    bulkIngest,
    mountSortedView,
    createEntity,
    deleteEntity,
  });

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      <div ref={containerRef} data-bench-harness>
        <div data-item-list>
          {ids.map(id => (
            <ItemView key={id} id={id} />
          ))}
        </div>
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
