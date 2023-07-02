import { useCache } from '@data-client/react';
import { queryRemainingTodos } from 'resources/TodoResource';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useCache(queryRemainingTodos, { userId });

  return <div>{remaining} tasks remaining</div>;
}
