---
title: useDLE() - [D]ata [L]oading [E]rror
sidebar_label: useDLE()
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import PkgTabs from '@site/src/components/PkgTabs';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

<head>
  <title>useDLE() - [D]ata [L]oading [E]rror React State</title>
</head>

High performance async data rendering without overfetching. With fetch meta data.

In case you cannot use [suspense](../getting-started/data-dependency.md#async-fallbacks), useDLE() is just like [useSuspense()](./useSuspense.md) but returns [D]ata [L]oading [E]rror values.

`useDLE()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

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
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList(): JSX.Element {
  const { data, loading, error } = useDLE(ProfileResource.getList);
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <>loading...</>;
  return (
    <div>
      {data.map(profile => (
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

## Behavior

| Expiry Status | Fetch           | Data         | Loading | Error             | Conditions                                                                                                                                                                   |
| ------------- | --------------- | ------------ | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | `undefined`  | true    | false             | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | yes<sup>1</sup> | denormalized | false   | false             | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                                 |
| Valid         | no              | denormalized | false   | maybe<sup>2</sup> | fetch completion                                                                                                                                                             |
|               | no              | `undefined`  | false   | false             | `null` used as second argument                                                                                                                                               |

:::note

1. Identical fetches are automatically deduplicated
2. [Hard errors](../concepts/error-policy.md#hard) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

:::

:::info React Native

When using React Navigation, useDLE() will trigger fetches on focus if the data is considered
stale.

:::

<ConditionalDependencies hook="useDLE" />

## Types

<GenericsTabs>

```typescript
function useDLE(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): {
  data: Denormalize<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

```typescript
function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): {
  data: DenormalizeNullable<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

</GenericsTabs>

## Examples

### Detail

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
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileDetail(): JSX.Element {
  const {
    data: profile,
    loading,
    error,
  } = useDLE(ProfileResource.get, { id: 1 });
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !profile) return <>loading...</>;
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
  const postDLE = useDLE(PostResource.get, { id });
  if (postDLE.error) return <div>Error {`${postDLE.error.status}`}</div>;
  if (postDLE.loading || !postDLE.data) return <>loading...</>;
  const authorDLE = useDLE(
    UserResource.get,
    postDLE.data.userId
      ? {
          id: postDLE.data.userId,
        }
      : null,
  );
  if (authorDLE.error) return <div>Error {`${authorDLE.error.status}`}</div>;
  if (authorDLE.loading || !authorDLE.data) return <>loading...</>;

  return <div>{authorDLE.data.username}</div>
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

```tsx title="ArticleList" {12  }
import { useDLE } from '@data-client/react';
import { getPosts } from './api/Post';

export default function ArticleList({ page }: { page: string }) {
  const { data, loading, error } = useDLE(getPosts, { page });
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <>loading...</>;
  const { results: posts, nextPage, lastPage } = data;
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
