import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';
  pk() {
    return this.id;
  }
}
export const PostResource = resource({
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
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  pk() {
    return this.id;
  }
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});
