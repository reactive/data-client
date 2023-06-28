import { v4 as uuid } from 'uuid';

import { TodoResource } from './resources';

export default function NewTodo({ userId }: { userId: number }) {
  const controller = useController();
  const handleKeyDown = async e => {
    if (e.key === 'Enter') {
      controller.fetch(TodoResource.create, {
        id: randomId(),
        userId,
        title: e.currentTarget.value,
      });
      e.currentTarget.value = '';
    }
  };
  return (
    <div>
      <input type="checkbox" name="new" checked={false} disabled />{' '}
      <input type="text" onKeyDown={handleKeyDown} />
    </div>
  );
}

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
