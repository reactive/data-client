// Type-checks published declarations (including legacy typesVersions outputs)
// with skipLibCheck: false; see tsconfig.typetest-libcheck.json
import { Endpoint, Entity, schema } from '@data-client/endpoint';
import { denormalize, MemoCache, normalize } from '@data-client/normalizr';
import { resource, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
  type = 'users';
}
class Post extends Entity {
  id = '';
  title = '';
  author = User.fromJS();
  static schema = { author: User };
}

const getUser = new Endpoint(
  (id: string) => Promise.resolve({ id, name: 'a', type: 'users' }),
  { schema: User },
);
const twoArgs = new Endpoint((a: string, b: number) =>
  Promise.resolve({ id: a, title: String(b) }),
);
const bound = twoArgs.bind(null, 'x');
bound(5);
// @ts-expect-error
bound('wrong');

const feed = new schema.Union({ users: User }, 'type');
const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'cursor',
});
PostResource.getList.getPage({ cursor: 'a' });
// create accepts FormData, like update and getList.push
PostResource.create(new FormData());
const search = new RestEndpoint({ path: '/search' });
// extend() methods' parameters aren't implicitly any on any TypeScript version,
// including on a chained extend()
const getPostTitle = new RestEndpoint({ path: '/posts/:id', schema: Post })
  .extend({ dataExpiryLength: 5 })
  .extend({
    process(value, params) {
      return `${params.id}: ${value.title}`;
    },
  });

const memo = new MemoCache();
const { result, entities } = normalize(Post, { id: '1', title: 'hi' });
denormalize(Post, result, entities);

export { getUser, feed, search, memo, getPostTitle };
