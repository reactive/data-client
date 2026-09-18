import { useSuspense } from '@data-client/react';

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
