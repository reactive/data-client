---
title: useSuspense() - Simplified data fetching for Vue
sidebar_label: useSuspense()
description: High performance async data rendering without overfetching. useSuspense() is like await for Vue components.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.vue.mdx';
import PaginationDemo from '../shared/\_pagination.vue.mdx';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';

# useSuspense()

<p class="tagline">
High performance async data rendering without overfetching.
</p>

[await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) `useSuspense()` in Vue components. This means the remainder of the component only runs after the data has loaded, avoiding the complexity of handling loading and error conditions. Instead, fallback handling is
[centralized](../getting-started/data-dependency.md#boundaries) with Vue's built-in [Suspense](https://vuejs.org/guide/built-ins/suspense.html).

`useSuspense()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'Promise', value: 'other' },
]}>
<TabItem value="rest">

<TypeScriptEditor>

```typescript title="ProfileResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  static key = 'Profile';
}

export const ProfileResource = resource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```html title="ProfileDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const profile = await useSuspense(ProfileResource.get, { id: 1 });
</script>

<template>
  <div class="listItem">
    <Avatar :src="profile.avatar" />
    <div>
      <h4>{{ profile.fullName }}</h4>
      <p>{{ profile.bio }}</p>
    </div>
  </div>
</template>
```

</TypeScriptEditor>

</TabItem>
<TabItem value="other">

<TypeScriptEditor>

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

```html title="ProfileDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getProfile } from './Profile';

  const profile = await useSuspense(getProfile, 1);
</script>

<template>
  <div class="listItem">
    <Avatar :src="profile.avatar" />
    <div>
      <h4>{{ profile.fullName }}</h4>
      <p>{{ profile.bio }}</p>
    </div>
  </div>
</template>
```

</TypeScriptEditor>

</TabItem>
</Tabs>

## Behavior

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](../concepts/expiry-policy.md).

| Expiry Status | Fetch           | Suspend | Error             | Conditions                                                                                                                                                             |
| ------------- | --------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | yes     | no                | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | yes<sup>1</sup> | no      | no                | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                           |
| Valid         | no              | no      | maybe<sup>2</sup> | fetch completion                                                                                                                                                       |
|               | no              | no      | no                | `null` used as second argument                                                                                                                                         |

:::note

1. Identical fetches are automatically deduplicated
2. [Hard errors](../concepts/error-policy.md#hard) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

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

<TypeScriptEditor row>

```typescript title="ProfileResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  static key = 'Profile';
}

export const ProfileResource = resource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```html title="ProfileList.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const profiles = await useSuspense(ProfileResource.getList);
</script>

<template>
  <div>
    <div class="listItem" v-for="profile in profiles" :key="profile.pk()">
      <Avatar :src="profile.avatar" />
      <div>
        <h4>{{ profile.fullName }}</h4>
        <p>{{ profile.bio }}</p>
      </div>
    </div>
  </div>
</template>
```

</TypeScriptEditor>

### Pagination

Reactive [pagination](/rest/guides/pagination) is achieved with [mutable schemas](/rest/api/Collection)

<PaginationDemo defaultTab="PostList" />

### Sequential

When fetch parameters depend on data from another resource.

```html
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { PostResource, UserResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, { id: props.id });
  const author = await useSuspense(UserResource.get, {
  // highlight-next-line
    id: post.value.userId,
  });
</script>
```

### Conditional

`null` will avoid binding and fetching data

<TypeScriptEditor row={false}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';

  static key = 'Post';
}
export const PostResource = resource({
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

  static key = 'User';
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```html title="PostWithAuthor.vue" {10-16}
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { PostResource, UserResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, { id: props.id });
  const author = await useSuspense(
    UserResource.get,
    computed(() =>
      post.value.userId
        ? {
            id: post.value.userId,
          }
        : null,
    ),
  );
  // author as ComputedRef<User | undefined>
</script>

<template>
  <div v-if="author">
    <!-- render author -->
  </div>
</template>
```

</TypeScriptEditor>

### Embedded data

When entities are stored in [nested structures](/rest/guides/relational-data#nesting), that structure will remain.

<TypeScriptEditor row={false}>

```typescript title="api/Post" {12-16}
export class PaginatedPost extends Entity {
  id = '';
  title = '';
  content = '';

  static key = 'PaginatedPost';
}

export const getPosts = new RestEndpoint({
  path: '/post',
  searchParams: { page: '' },
  schema: {
    posts: new schema.Collection([PaginatedPost]),
    nextPage: '',
    lastPage: '',
  },
});
```

```html title="ArticleList.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getPosts } from './api/Post';

  const props = defineProps<{ page: string }>();
  const data = await useSuspense(getPosts, { page: props.page });
</script>

<template>
  <div>
    <div v-for="post in data.posts" :key="post.pk()">{{ post.title }}</div>
  </div>
</template>
```

</TypeScriptEditor>

