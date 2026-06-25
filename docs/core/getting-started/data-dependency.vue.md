---
title: Rendering Asynchronous Data in Vue
sidebar_label: Render Data
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import ConditionalDependencies from '../shared/\_conditional_dependencies.vue.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.vue.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.vue.mdx';

# Rendering Asynchronous Data

Make your components reusable by binding the data where you **use** it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data with [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<TypeScriptEditor row>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

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

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'page',
});
```

```html title="PostDetail.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const emit = defineEmits<{ setRoute: [route: string] }>();
  const post = await useSuspense(PostResource.get, { id: props.id });
</script>

<template>
  <div>
    <header>
      <div class="listItem spaced">
        <div class="author">
          <Avatar :src="post.author.profileImage" />
          <small>{{ post.author.name }}</small>
        </div>
        <h4>{{ post.title }}</h4>
      </div>
    </header>
    <p>{{ post.body }}</p>
    <a href="#" @click.prevent="emit('setRoute', 'list')">« Back</a>
  </div>
</template>
```

```html title="PostItem.vue" collapsed
<script setup lang="ts">
  import { type Post } from './Resources';

  defineProps<{ post: Post }>();
  const emit = defineEmits<{ setRoute: [route: string] }>();
</script>

<template>
  <div class="listItem spaced">
    <Avatar :src="post.author.profileImage" />
    <div>
      <h4>
        <a href="#" @click.prevent="emit('setRoute', `detail/${post.id}`)">
          {{ post.title }}
        </a>
      </h4>
      <small>by {{ post.author.name }}</small>
    </div>
  </div>
</template>
```

```html title="PostList.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import PostItem from './PostItem.vue';
  import { PostResource } from './Resources';

  const emit = defineEmits<{ setRoute: [route: string] }>();
  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div>
    <PostItem
      v-for="post in posts"
      :key="post.pk()"
      :post="post"
      @setRoute="emit('setRoute', $event)"
    />
  </div>
</template>
```

</TypeScriptEditor>

<a href="https://react.dev/learn/passing-data-deeply-with-context" target="_blank">
<ThemedImage
alt="Endpoints used in many contexts"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

Do not [prop drill](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). Instead, [useSuspense()](../api/useSuspense.md) in the components that render the data from it. This is
known as _data co-location_.

Instead of writing complex update functions or invalidations cascades, Reactive Data Client automatically updates
bound components immediately upon [data change](./mutations.md). This is known as _reactive programming_.

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much with [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place [&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) to handling loading and error conditions at or above navigational boundaries like **pages,
routes, or [modals](https://www.appcues.com/blog/modal-dialog-windows)**.

<AsyncBoundaryExamples />

AsyncBoundary's [error fallback](../api/AsyncBoundary.md#errorcomponent) and [loading fallback](../api/AsyncBoundary.md#fallback) can both
be customized.

### Stateful

You may find cases where it's still useful to use a stateful approach to fallbacks when using React 16 and 17.
For these cases, or compatibility with some component libraries, [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror - is provided.

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
  import { useDLE } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const { data, loading, error } = useDLE(ProfileResource.getList);
</script>

<template>
  <div v-if="error">Error {{ error.status }}</div>
  <Loading v-else-if="loading || !data" />
  <div v-else>
    <div class="listItem" v-for="profile in data" :key="profile.pk()">
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

Since [useDLE](../api/useDLE.md) does not [useSuspense](../api/useSuspense.md), you won't be able to easily centrally
orchestrate loading and error code.

## Conditional

<ConditionalDependencies />

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted. [useLive()](../api/useLive.md) calls both
[useSubscription()](../api/useSubscription.md) and [useSuspense()](../api/useSuspense.md), making it quite
easy to use fresh data.

<UseLive />

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency) to an Endpoint or Resource.
For pushed based networking protocols like SSE and websockets, see the [example stream manager](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```

