import { UserResource } from './resources';
import TodoList from './TodoList';

function UserList() {
  const users = useSuspense(UserResource.getList);
  return (
    // todos glide to wherever a change moves them
    <Reorder layoutDependency={users}>
      {users.map(user => (
        <TodoList key={user.pk()} user={user} />
      ))}
    </Reorder>
  );
}
render(<UserList />);
