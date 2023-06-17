export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
const BaseTodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  optimistic: true,
});
export const TodoResource = {
  ...BaseTodoResource,
  getList: BaseTodoResource.getList.extend({
    process(todos) {
      // for demo purposes we'll only use the first seven
      return todos.slice(0, 7);
    },
  }),
  queryRemaining: new Query(
    new schema.All(Todo),
    (entries, { userId } = {}) => {
      if (userId !== undefined)
        return entries.filter(todo => todo.userId === userId && !todo.completed)
          .length;
      return entries.filter(todo => !todo.completed).length;
    },
  ),
};
