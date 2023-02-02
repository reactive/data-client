import { useCache } from '@rest-hooks/react';
import { queryRemaining } from 'resources/TodoResource';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useCache(queryRemaining, { userId });

  return <div>{remaining} tasks remaining</div>;
}
