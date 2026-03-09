import { DataProvider, useCache, useController } from '@data-client/react';
import { mockInitialState } from '@data-client/react/mock';
import { ItemRow } from '@shared/components';
import { FIXTURE_AUTHORS, FIXTURE_ITEMS } from '@shared/data';
import { captureSnapshot, getReport, registerRefs } from '@shared/refStability';
import type { Item, UpdateAuthorOptions } from '@shared/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { getAuthor, getItem, getItemList } from './resources';

const initialState = mockInitialState([
  { endpoint: getItemList, args: [], response: FIXTURE_ITEMS },
  ...FIXTURE_ITEMS.map(item => ({
    endpoint: getItem,
    args: [{ id: item.id }] as [{ id: string }],
    response: item,
  })),
  ...FIXTURE_AUTHORS.map(author => ({
    endpoint: getAuthor,
    args: [{ id: author.id }] as [{ id: string }],
    response: author,
  })),
]);

function ItemView({ id }: { id: string }) {
  const item = useCache(getItem, { id });
  if (!item) return null;
  const itemAsItem = item as unknown as Item;
  registerRefs(id, itemAsItem, itemAsItem.author);
  return <ItemRow item={itemAsItem} />;
}

function BenchmarkHarness() {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controller = useController();

  const setComplete = useCallback(() => {
    containerRef.current?.setAttribute('data-bench-complete', 'true');
  }, []);

  const mount = useCallback(
    (n: number) => {
      performance.mark('mount-start');
      setCount(n);
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
      const item = FIXTURE_ITEMS.find(i => i.id === id);
      if (item) {
        controller.setResponse(
          getItem,
          { id },
          {
            ...item,
            label: `${item.label} (updated)`,
          },
        );
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('update-end');
          performance.measure('update-duration', 'update-start', 'update-end');
          setComplete();
        });
      });
    },
    [controller, setComplete],
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
          controller.setResponse(
            getAuthor,
            { id: authorId },
            {
              ...author,
              name: `${author.name} (updated)`,
            },
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
    [controller, setComplete],
  );

  const unmountAll = useCallback(() => {
    setCount(0);
  }, []);

  const getRenderedCount = useCallback(() => count, [count]);

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
    };
    return () => {
      delete window.__BENCH__;
    };
  }, [
    mount,
    updateEntity,
    updateAuthor,
    unmountAll,
    getRenderedCount,
    captureRefSnapshot,
    getRefStabilityReport,
  ]);

  useEffect(() => {
    document.body.setAttribute('data-app-ready', 'true');
  }, []);

  const ids = FIXTURE_ITEMS.slice(0, count).map(i => i.id);

  return (
    <div ref={containerRef} data-bench-harness>
      <div data-item-list>
        {ids.map(id => (
          <ItemView key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root') ?? document.body;
createRoot(rootEl).render(
  <DataProvider initialState={initialState}>
    <BenchmarkHarness />
  </DataProvider>,
);
