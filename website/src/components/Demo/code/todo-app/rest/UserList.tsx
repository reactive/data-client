import { UserResource } from './resources';
import TodoList from './TodoList';

function UserList() {
  const users = useSuspense(UserResource.getList);
  return (
    <div>
      {users.map(user => (
        <section key={user.pk()}>
          <h4>{user.name}&apos;s tasks</h4>
          <TodoList todos={user.todos} userId={user.id} />
        </section>
      ))}
    </div>
  );
}
render(<UserList />);
