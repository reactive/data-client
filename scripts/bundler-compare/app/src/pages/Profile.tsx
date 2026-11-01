import { useSuspense } from '@data-client/react';

import { getCandles, UserResource } from '../resources';

export default function Profile() {
  const user = useSuspense(UserResource.get, { id: 1 });
  const candles = useSuspense(getCandles, { product_id: 'BTC-USD' });
  return (
    <>
      {user.name} {user.todos.length} {candles.length}
    </>
  );
}
