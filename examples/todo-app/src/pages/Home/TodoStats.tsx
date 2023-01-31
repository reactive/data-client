import { useCache } from '@rest-hooks/react';
import { TodoResource } from 'resources/TodoResource';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useCache(TodoResource.tasksRemaining, { userId });

  return <div>{remaining} tasks remaining</div>;
}
