---
title: useSuspense()
---

<head>
  <title>useSuspense() - Simplified data fetching for React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';

High performance async data rendering without overfetching.

`useSuspense()` [suspends](../getting-started/data-dependency.md#async-fallbacks) rendering until the data is available. This is much like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)ing an [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) function. This avoids the complexity of handling loading and error conditions in your components by
[centralizing](../getting-started/data-dependency.md#boundaries) them with a singular [AsyncBoundary](../api/AsyncBoundary.md).

`useSuspense()` will rerender when its data [mutates](../getting-started/mutations.md).

## Usage

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'Promise', value: 'other' },
]}>
<TabItem value="rest">

<HooksPlayground fixtures={detailFixtures} row>

```typescript title="ProfileResource" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Profile';
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileDetail"
import { useSuspense } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileDetail(): JSX.Element {
  const profile = useSuspense(ProfileResource.get, { id: 1 });
  return (
    <div className="listItem">
      <Avatar src={profile.avatar} />
      <div>
        <h4>{profile.fullName}</h4>
        <p>{profile.bio}</p>
      </div>
    </div>
  );
}
render(<ProfileDetail />);
```

</HooksPlayground>

</TabItem>
<TabItem value="other">

<HooksPlayground row>

```typescript title="Profile" collapsed
import { Endpoint } from '@data-client/endpoint';

export const getProfile = new Endpoint(
  (id: number) =>
    Promise.resolve({
      id,
      fullName: 'Jing Chen',
      bio: 'Creator of Flux Architecture',
      avatar: 'https://avatars.githubusercontent.com/u/5050204?v=4',
    }),
  {
    key(id) {
      return `getProfile${id}`;
    },
  },
);
```

```tsx title="ProfileDetail"
import { useSuspense } from '@data-client/react';
import { getProfile } from './Profile';

function ProfileDetail(): JSX.Element {
  const profile = useSuspense(getProfile, 1);
  return (
    <div className="listItem">
      <Avatar src={profile.avatar} />
      <div>
        <h4>{profile.fullName}</h4>
        <p>{profile.bio}</p>
      </div>
    </div>
  );
}
render(<ProfileDetail />);
```

</HooksPlayground>

</TabItem>
</Tabs>

## Behavior

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](../concepts/expiry-policy.md).

| Expiry Status | Fetch           | Suspend | Error             | Conditions                                                                                                                                                                   |
| ------------- | --------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | yes     | no                | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | yes<sup>1</sup> | no      | no                | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                                 |
| Valid         | no              | no      | maybe<sup>2</sup> | fetch completion                                                                                                                                                             |
|               | no              | no      | no                | `null` used as second argument                                                                                                                                               |

:::note

1. Identical fetches are automatically deduplicated
2. [Hard errors](../concepts/error-policy.md#hard) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

:::

:::info React Native

When using React Navigation, useSuspense() will trigger fetches on focus if the data is considered
stale.

:::

<ConditionalDependencies />

## Types

<GenericsTabs>

```typescript
function useSuspense(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema>;
```

```typescript
function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends Exclude<Schema, null>
  ? Denormalize<E['schema']>
  : ReturnType<E>;
```

</GenericsTabs>

## Examples

### List

<HooksPlayground fixtures={listFixtures} row>

```typescript title="ProfileResource" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Profile';
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList"
import { useSuspense } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList(): JSX.Element {
  const profiles = useSuspense(ProfileResource.getList);
  return (
    <div>
      {profiles.map(profile => (
        <div className="listItem" key={profile.pk()}>
          <Avatar src={profile.avatar} />
          <div>
            <h4>{profile.fullName}</h4>
            <p>{profile.bio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
render(<ProfileList />);
```

</HooksPlayground>

### Sequential

When fetch parameters depend on data from another resource.

```tsx
function PostWithAuthor() {
  const post = useSuspense(PostResource.get, { id });
  // post as Post
  const author = useSuspense(UserResource.get, {
    id: post.userId,
  });
  // author as User
}
```

### Conditional

`null` will avoid binding and fetching data

<TypeScriptEditor row={false}>

```ts title="Resources" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Post';
}
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
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
    return `${this.id}`;
  }
  static key = 'User';
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```tsx title="PostWithAuthor"
import { PostResource, UserResource } from './Resources';

export default function PostWithAuthor({ id }: { id: string }) {
  const post = useSuspense(PostResource.get, { id });
  // post as Post
  const author = useSuspense(
    UserResource.get,
    post.userId
      ? {
          id: post.userId,
        }
      : null,
  );
  // author as User | undefined
  if (!author) return;
}
```

</TypeScriptEditor>

### Embedded data

When entities are stored in [nested structures](/rest/guides/relational-data#nesting), that structure will remain.

<TypeScriptEditor row={false}>

```typescript title="api/Post"
export class PaginatedPost extends Entity {
  id = '';
  title = '';
  content = '';

  pk() {
    return this.id;
  }
  static key = 'PaginatedPost';
}

export const getPosts = new RestEndpoint({
  path: '/post',
  searchParams: { page: '' },
  schema: {
    results: new schema.Collection([PaginatedPost]),
    nextPage: '',
    lastPage: '',
  },
});
```

```tsx title="ArticleList"
import { getPosts } from './api/Post';

export default function ArticleList({ page }: { page: string }) {
  const {
    results: posts,
    nextPage,
    lastPage,
  } = useSuspense(getPosts, { page });
  return (
    <div>
      {posts.map(post => (
        <div key={post.pk()}>{post.title}</div>
      ))}
    </div>
  );
}
```

</TypeScriptEditor>

### Server Side Rendering

[Server Side Rendering](../guides/ssr.md) to incrementally stream HTML,
greatly reducing [TTFB](https://web.dev/ttfb/). [Reactive Data Client SSR's](../guides/ssr.md) automatic store hydration
means immediate user interactivity with **zero** client-side fetches on first load.

<StackBlitz app="nextjs" file="resources/TodoResource.ts,components/todo/TodoList.tsx" />

### Concurrent Mode

In React 18 navigating with `startTransition` allows [AsyncBoundaries](./AsyncBoundary.md) to
continue showing the previous screen while the new data loads. Combined with
[streaming server side rendering](../guides/ssr.md), this eliminates the need to flash annoying
loading indicators - improving the user experience.

Click one of the names to navigate to their todos. Here long loading states are indicated by the
less intrusive _loading bar_, like YouTube and Robinhood use.

<StackBlitz app="todo-app" file="src/pages/Home/TodoList.tsx,src/pages/Home/index.tsx,src/useNavigationState.ts" height={600} />
