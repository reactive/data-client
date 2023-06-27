import { Entity } from '@rest-hooks/rest';
import { createResource } from '@rest-hooks/rest/next';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';
  pk() {
    return `${this.id}`;
  }
}
export const PostResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/posts/:id',
  schema: Post,
  searchParams: {} as { userId?: string | number } | undefined,
  optimistic: true,
});

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';

  get profileImage() {
    return `https://i.pravatar.cc/256?img=${this.id + 4}`;
  }

  pk() {
    return `${this.id}`;
  }
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});
