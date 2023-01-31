import { useCache } from '@rest-hooks/react';
import { tasksRemaining } from 'resources/TodoResource';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useCache(tasksRemaining, { userId });

  return <div>{remaining} tasks remaining</div>;
}
