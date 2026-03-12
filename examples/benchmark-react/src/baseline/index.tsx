import {
  onProfilerRender,
  useBenchState,
  waitForPaint,
} from '@shared/benchHarness';
import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS_BY_ID,
  FIXTURE_ITEMS,
  generateFreshData,
} from '@shared/data';
import { registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
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
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.label.localeCompare(b.label)),
    [items],
  );
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
      const sliced = FIXTURE_ITEMS.slice(0, n);
      const slicedIds = sliced.map(i => i.id);
      measureMount(() => {
        setItems(sliced);
        setIds(slicedIds);
      });
    },
    [measureMount, setIds],
  );

  const updateEntity = useCallback(
    (id: string) => {
      measureUpdate(() => {
        setItems(prev =>
          prev.map(item =>
            item.id === id ?
              { ...item, label: `${item.label} (updated)` }
            : item,
          ),
        );
      });
    },
    [measureUpdate],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      const author = FIXTURE_AUTHORS_BY_ID.get(authorId);
      if (!author) return;
      const newAuthor = { ...author, name: `${author.name} (updated)` };
      measureUpdateWithDelay(options, () => {
        setItems(prev =>
          prev.map(item =>
            item.author.id === authorId ? { ...item, author: newAuthor } : item,
          ),
        );
      });
    },
    [measureUpdateWithDelay],
  );

  const unmountAll = useCallback(() => {
    unmountBase();
    setItems([]);
  }, [unmountBase]);

  const bulkIngest = useCallback(
    (n: number) => {
      const { items: freshItems } = generateFreshData(n);
      const freshIds = freshItems.map(i => i.id);
      measureMount(() => {
        setItems(freshItems);
        setIds(freshIds);
      });
    },
    [measureMount, setIds],
  );

  const mountSortedView = useCallback(
    (n: number) => {
      const sliced = FIXTURE_ITEMS.slice(0, n);
      measureMount(() => {
        setItems(sliced);
        setShowSortedView(true);
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
