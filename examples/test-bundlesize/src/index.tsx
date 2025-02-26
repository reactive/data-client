import { AsyncBoundary, DataProvider, useSuspense } from '@data-client/react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { getCandles, TodoResource } from './resources';

export const Doit = () => {
  const a = useSuspense(getCandles, { product_id: 'BTC-USD' });
  const todos = useSuspense(TodoResource.getList, { userId: 1 });
  return (
    <>
      {a} hi {todos.length}
    </>
  );
};
export const second = React.memo(Doit);

export default function Entry() {
  return (
    <DataProvider>
      <AsyncBoundary>
        <Doit />
      </AsyncBoundary>
    </DataProvider>
  );
}
export const renderedElement = <Entry />;

createRoot(document.getElementById('root') || document.body).render(
  renderedElement,
);
