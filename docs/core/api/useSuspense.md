---
title: useSuspense()
---

<head>
  <title>useSuspense() - Data fetching with Suspense</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

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

Excellent for guaranteed data rendering.

`useSuspense()` [suspends](../getting-started/data-dependency#async-fallbacks) rendering until the data is available. This is much like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)ing an [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) function. That is to say, the lines after the function won't be run until resolution (data is available).

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](../getting-started/expiry-policy.md).

| Expiry Status | Fetch           | Suspend           | Error             | Conditions                                                                                            |
| ------------- | --------------- | ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | yes               | no                | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../getting-started/expiry-policy.md#endpointinvalidifstale) |
| Stale         | yes<sup>1</sup> | no | no                | (first-render, arg change) & [expiry &lt; now](../getting-started/expiry-policy.md)                   |
| Valid         | no              | no                | maybe<sup>2</sup> | fetch completion                                                                                      |
| Ignore        | no              | no                | no                | `null` used as second argument                                                                        |

:::note

1. Identical fetches are automatically deduplicated
2. [Hard errors](../getting-started/expiry-policy.md#error-policy) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

:::

:::info React Native

When using React Navigation, useSuspense() will trigger fetches on focus if the data is considered
stale.

:::

<ConditionalDependencies />

## Single

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

```typescript title="api/Profile.ts" collapsed
import { Entity, createResource } from '@rest-hooks/rest';

export class Profile extends Entity {
  readonly id: number | undefined = undefined;
  readonly img: string = '';
  readonly fullName: string = '';
  readonly bio: string = '';

  pk() {
    return this.id?.toString();
  }
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList.tsx"
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

## List

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/profiles'}),
args: [],
response: [{ id: '1', fullName: 'Einstein', bio: 'Smart physicist' },{ id: '2', fullName: 'Elon Musk', bio: 'CEO of Tesla, SpaceX and owner of Twitter' }],
delay: 150,
},
]}>

```typescript title="api/Profile.ts" collapsed
import { Entity, createResource } from '@rest-hooks/rest';

export class Profile extends Entity {
  readonly id: number | undefined = undefined;
  readonly img: string = '';
  readonly fullName: string = '';
  readonly bio: string = '';

  pk() {
    return this.id?.toString();
  }
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList.tsx"
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

## Sequential

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

## Embedded data

When entities are stored in nested structures, that structure will remain.

```typescript
export class PaginatedPost extends Entity {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';

  pk() {
    return this.id;
  }
}

export const getPosts = new RestEndpoint({
  path: '/post\\?page=:page',
  schema: { results: [PaginatedPost], nextPage: '', lastPage: '' },
});
```

```tsx
function ArticleList({ page }: { page: string }) {
  const {
    results: posts,
    nextPage,
    lastPage,
  } = useSuspense(getPosts, { page });
  // posts as PaginatedPostResource[]
}
```

## Useful `Endpoint`s to send

[Resource](/rest/api/createResource#members) provides these built-in:

- [get](/rest/api/createResource#get)
- [getList](/rest/api/createResource#getlist)

Feel free to add your own [RestEndpoint](/rest/api/RestEndpoint) as well.
