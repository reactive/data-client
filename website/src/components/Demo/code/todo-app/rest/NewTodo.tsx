import { TodoResource } from './resources';

export default function NewTodo({ userId }: { userId: number }) {
  const controller = useController();
  const handleKeyDown = async e => {
    if (e.key === 'Enter') {
      controller.fetch(TodoResource.getList.push, {
        id: randomId(),
        userId,
        title: e.currentTarget.value,
      });
      e.currentTarget.value = '';
    }
  };
  return (
    <div className="listItem nogap">
      <label>
        <input type="checkbox" name="new" checked={false} disabled />
        <input type="text" onKeyDown={handleKeyDown} />
      </label>
      <CancelButton />
    </div>
  );
}

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
