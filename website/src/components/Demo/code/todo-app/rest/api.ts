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
});
export const TodoResource = {
  ...BaseTodoResource,
  getList: BaseTodoResource.getList.extend({
    process(todos) {
      // for demo purposes we'll only use the first seven
      return todos.slice(0, 7);
    },
  }),
  partialUpdate: BaseTodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
        ...body,
      };
    },
  }),
  delete: BaseTodoResource.delete.extend({
    getOptimisticResponse(snap, params) {
      return params;
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
