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
import {RestEndpoint} from '@rest-hooks/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

High performance async data rendering without overfetching.

`useSuspense()` [suspends](../getting-started/data-dependency#async-fallbacks) rendering until the data is available. This is much like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)ing an [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) function. This avoids the complexity of handling loading and error conditions in your components by
centralizing them with a singular [AsyncBoundary](../getting-started/data-dependency.md#async-fallbacks).

## Usage

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'Promise', value: 'other' },
]}>
<TabItem value="rest">

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/profiles/:id'}),
args: [{id:1}],
response: { id: '1', fullName: 'Einstein', bio: 'Smart physicist' },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/profiles/:id'}),
args: [{id:2}],
response: { id: '2', fullName: 'Elon Musk', bio: 'CEO of Tesla, SpaceX and owner of Twitter' },
delay: 150,
},
]}>

```typescript title="api/Profile" collapsed
import { Entity, createResource } from '@rest-hooks/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  img = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList"
import { useSuspense } from '@rest-hooks/react';
import { ProfileResource } from './api/Profile';

function ProfileDetail(): JSX.Element {
  const profile = useSuspense(ProfileResource.get, { id: 1 });
  return (
    <div>
      <h4>{profile.fullName}</h4>
      <p>{profile.bio}</p>
    </div>
  );
}
render(<ProfileDetail />);
```

</HooksPlayground>

</TabItem>
<TabItem value="other">

<HooksPlayground>

```typescript title="api/Profile" collapsed
import { Endpoint } from '@rest-hooks/endpoint';

export const getProfile = new Endpoint((id: number) =>
  Promise.resolve({ id, fullName: 'Einstein', bio: 'Smart physicist' }),
);
```

```tsx title="ProfileList"
import { useSuspense } from '@rest-hooks/react';
import { getProfile } from './api/Profile';

function ProfileDetail(): JSX.Element {
  const profile = useSuspense(getProfile, 1);
  return (
    <div>
      <h4>{profile.fullName}</h4>
      <p>{profile.bio}</p>
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
2. [Hard errors](../concepts/expiry-policy.md#error-policy) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

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
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
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

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/profiles'}),
args: [],
response: [{ id: '1', fullName: 'Einstein', bio: 'Smart physicist' },{ id: '2', fullName: 'Elon Musk', bio: 'CEO of Tesla, SpaceX and owner of Twitter' }],
delay: 150,
},
]}>

```typescript title="api/Profile" collapsed
import { Entity, createResource } from '@rest-hooks/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  img = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList"
import { useSuspense } from '@rest-hooks/react';
import { ProfileResource } from './api/Profile';

function ProfileList(): JSX.Element {
  const profiles = useSuspense(ProfileResource.getList);
  return (
    <div>
      {profiles.map(profile => (
        <div key={profile.pk()}>
          <h4>{profile.fullName}</h4>
          <p>{profile.bio}</p>
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

### Embedded data

When entities are stored in nested structures, that structure will remain.

<TypeScriptEditor row={false}>

```typescript title="api/Post
export class PaginatedPost extends Entity {
  id = '';
  title = '';
  content = '';

  pk() {
    return this.id;
  }
}

export const getPosts = new RestEndpoint({
  path: '/post',
  searchParams: { page: '' },
  schema: { results: [PaginatedPost], nextPage: '', lastPage: '' },
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

### Todo App

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoList.tsx" />

Explore more [Rest Hooks demos](/demos)
