import { Entity, Collection, resource } from '@data-client/rest';
import { v4 as uuid } from 'uuid';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}
export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  website = '';
  todos: Todo[] = [];

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static key = 'User';

  static schema = {
    todos: new Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});

export const todoFixtures = [
  {
    endpoint: UserResource.getList,
    async response(...args: any) {
      return (await UserResource.getList(...args)).slice(0, 3);
    },
  },
  {
    endpoint: TodoResource.getList,
    async response(...args: any) {
      return (await TodoResource.getList(...args)).slice(0, 7);
    },
  },
  {
    endpoint: TodoResource.partialUpdate,
    async response(...args: any) {
      return {
        ...(await TodoResource.partialUpdate(...args)),
        id: args?.[0]?.id,
      };
    },
  },
  {
    endpoint: TodoResource.getList.push,
    async response(...args: any) {
      //await new Promise(resolve => setTimeout(resolve, 500));
      return {
        ...(await TodoResource.getList.push(...args)),
        id: randomId(),
      };
    },
  },
];
function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
