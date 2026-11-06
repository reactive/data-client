import { useCache } from '@data-client/react';

import { TodoResource } from './api';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useCache(TodoResource.queryRemaining, { userId });

  return <p className="meta">{remaining} tasks remaining</p>;
}
