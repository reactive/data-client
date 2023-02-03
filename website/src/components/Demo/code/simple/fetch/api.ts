import { Endpoint } from '@rest-hooks/endpoint';

interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

const fetchTodo = (id: string | number): Promise<Todo> =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

export const getTodo = new Endpoint(fetchTodo);
