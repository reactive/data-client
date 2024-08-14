export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
