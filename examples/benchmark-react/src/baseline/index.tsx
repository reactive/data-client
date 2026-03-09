import { ItemRow } from '@shared/components';
import {
  FIXTURE_AUTHORS,
  FIXTURE_ITEMS,
  generateFreshData,
} from '@shared/data';
import { captureSnapshot, getReport, registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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

function BenchmarkHarness() {
  const [items, setItems] = useState<Item[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const completeResolveRef = useRef<(() => void) | null>(null);

  const setComplete = useCallback(() => {
    completeResolveRef.current?.();
    completeResolveRef.current = null;
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

  const mount = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      const sliced = FIXTURE_ITEMS.slice(0, n);
      setItems(sliced);
      setIds(sliced.map(i => i.id));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [setComplete],
  );

  const updateEntity = useCallback(
    (id: string) => {
      performance.mark('update-start');
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, label: `${item.label} (updated)` } : item,
        ),
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      });
    },
    [setComplete],
  );

  const updateAuthor = useCallback(
    (authorId: string, options?: UpdateAuthorOptions) => {
      performance.mark('update-start');
      const delayMs = options?.simulateNetworkDelayMs ?? 0;
      const requestCount = options?.simulatedRequestCount ?? 1;
      const totalDelayMs = delayMs * requestCount;

      const doUpdate = () => {
        const author = FIXTURE_AUTHORS.find(a => a.id === authorId);
        if (author) {
          const newAuthor = {
            ...author,
            name: `${author.name} (updated)`,
          };
          setItems(prev =>
            prev.map(item =>
              item.author.id === authorId ?
                { ...item, author: newAuthor }
              : item,
            ),
          );
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            performance.mark('update-end');
            performance.measure(
              'update-duration',
              'update-start',
              'update-end',
            );
            setComplete();
          });
        });
      };

      if (totalDelayMs > 0) {
        setTimeout(doUpdate, totalDelayMs);
      } else {
        doUpdate();
      }
    },
    [setComplete],
  );

  const unmountAll = useCallback(() => {
    setIds([]);
    setItems([]);
  }, []);

  const bulkIngest = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      const { items: freshItems } = generateFreshData(n);
      setItems(freshItems);
      setIds(freshItems.map(i => i.id));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('mount-end');
          performance.measure('mount-duration', 'mount-start', 'mount-end');
          setComplete();
        });
      });
    },
    [setComplete],
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
        await new Promise<void>(r =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
      }
      setComplete();
    },
    [mount, unmountAll, setComplete],
  );

  const getRenderedCount = useCallback(() => ids.length, [ids]);

  const captureRefSnapshot = useCallback(() => {
    captureSnapshot();
  }, []);

  const getRefStabilityReport = useCallback(() => getReport(), []);

  useEffect(() => {
    window.__BENCH__ = {
      mount,
      updateEntity,
      updateAuthor,
      unmountAll,
      getRenderedCount,
      captureRefSnapshot,
      getRefStabilityReport,
      mountUnmountCycle,
      bulkIngest,
    };
    return () => {
      delete window.__BENCH__;
    };
  }, [
    mount,
    updateEntity,
    updateAuthor,
    unmountAll,
    mountUnmountCycle,
    bulkIngest,
    getRenderedCount,
    captureRefSnapshot,
    getRefStabilityReport,
  ]);

  useEffect(() => {
    document.body.setAttribute('data-app-ready', 'true');
  }, []);

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      <div ref={containerRef} data-bench-harness>
        <div data-item-list>
          {ids.map(id => (
            <ItemView key={id} id={id} />
          ))}
        </div>
      </div>
    </ItemsContext.Provider>
  );
}

function onProfilerRender(
  _id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
) {
  performance.measure(`react-commit-${phase}`, {
    start: performance.now() - actualDuration,
    duration: actualDuration,
  });
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <React.Profiler id="bench" onRender={onProfilerRender}>
    <BenchmarkHarness />
  </React.Profiler>,
);
