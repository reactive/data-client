import NewTodo from './NewTodo';
import { type User } from './resources';
import TodoItem from './TodoItem';

export default function TodoList({ user }: { user: User }) {
  return (
    // todos dragged here are assigned to this user
    <section
      ref={useReorderItem(`user ${user.pk()}`, {
        dropValue: user.id,
      })}
    >
      <h4>{user.name}&apos;s tasks</h4>
      <div className="list">
        {user.todos.map(todo => (
          <TodoItem key={todo.pk()} todo={todo} />
        ))}
        <NewTodo userId={user.id} />
      </div>
    </section>
  );
}
