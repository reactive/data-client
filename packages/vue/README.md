<h1>
<div align="center">
<a href="https://dataclient.io" target="_blank" rel="noopener">
  <img alt="Reactive Data Client" src="https://raw.githubusercontent.com/reactive/data-client/master/packages/vue/data_client_logo_and_text.svg?sanitize=true">
</a>
</div>
</h1>

The scalable way to build applications with [dynamic data](https://dataclient.io/docs/getting-started/mutations).

[Declarative resouce definitons](https://dataclient.io/docs/getting-started/resource) for [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/docs/concepts/managers#data-stream) and [more](https://dataclient.io/rest/api/Endpoint)
<br/>[Performant rendering](https://dataclient.io/docs/getting-started/data-dependency) in [Vue 3](https://vuejs.org/)

Schema driven. Zero updater functions.

<div align="center">

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/reactive/data-client.svg)](https://github.com/reactive/data-client/issues 'Percentage of issues still open')
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/vue?style=flat-square)](https://bundlephobia.com/result?p=@data-client/vue)
[![npm version](https://img.shields.io/npm/v/@data-client/vue.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/vue)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Codegen GPT](https://img.shields.io/badge/chatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white)](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp; [🤖Codegen](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen) &nbsp;|&nbsp; [🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/vue-todo-app?file=src%2Fcomponents%2FTodoListContent.vue)

</div>

## Installation

```bash
npm install --save @data-client/vue @data-client/rest
```

For more details, see [the Installation docs page](https://dataclient.io/docs/getting-started/installation).

### Skills

```bash
npx skills add reactive/data-client
```

Then run [skill](https://agentskills.io) "rdc-setup"

## Usage

### Simple [TypeScript definition](https://dataclient.io/rest/api/Entity)

```typescript
class User extends Entity {
  id = '';
  username = '';
}

class Article extends Entity {
  id = '';
  title = '';
  body = '';
  author = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

### Create [collection of API Endpoints](https://dataclient.io/docs/getting-started/resource)

```typescript
const UserResource = resource({
  path: '/users/:id',
  schema: User,
  optimistic: true,
});

const ArticleResource = resource({
  path: '/articles/:id',
  schema: Article,
  searchParams: {} as { author?: string },
  optimistic: true,
  paginationField: 'cursor',
});
```

### One line [data binding](https://dataclient.io/docs/getting-started/data-dependency)

```vue
<template>
  <article>
    <h2>
      {{ article.title }} by {{ article.author.username }}
    </h2>
    <p>{{ article.body }}</p>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ id: string }>();
const article = await useSuspense(ArticleResource.get, { id: props.id });
</script>
```

### [Reactive Mutations](https://dataclient.io/docs/getting-started/mutations)

```vue
<template>
  <div>
    <CreateArticleForm @submit="handleCreateArticle" />
    <ProfileForm @submit="handleUpdateProfile" />
    <button @click="handleDeleteArticle">Delete</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ id: string; article: Article }>();
const ctrl = useController();

const handleCreateArticle = (article: Partial<Article>) =>
  ctrl.fetch(ArticleResource.getList.push, { id: props.id }, article);

const handleUpdateProfile = (user: Partial<User>) =>
  ctrl.fetch(UserResource.update, { id: props.article.author.id }, user);

const handleDeleteArticle = () =>
  ctrl.fetch(ArticleResource.delete, { id: props.id });
</script>
```

### [Subscriptions](https://dataclient.io/docs/api/useLive)

```vue
<template>
  <div>{{ price.value }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ symbol: string }>();
const price = useLive(PriceResource.get, { symbol: props.symbol });
</script>
```

### [Type-safe Imperative Actions](https://dataclient.io/docs/api/Controller)

```typescript
const ctrl = useController();
await ctrl.fetch(ArticleResource.update, { id }, articleData);
await ctrl.fetchIfStale(ArticleResource.get, { id });
ctrl.expireAll(ArticleResource.getList);
ctrl.invalidate(ArticleResource.get, { id });
ctrl.invalidateAll(ArticleResource.getList);
ctrl.setResponse(ArticleResource.get, { id }, articleData);
ctrl.set(Article, { id }, articleData);
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```typescript
const queryTotalVotes = new Query(
  new Collection([BlogPost]),
  posts => posts.reduce((total, post) => total + post.votes, 0),
);

const totalVotes = useQuery(queryTotalVotes);
const totalVotesForUser = useQuery(queryTotalVotes, { userId });
```

```typescript
const groupTodoByUser = new Query(
  TodoResource.getList.schema,
  todos => Object.groupBy(todos, todo => todo.userId),
);
const todosByUser = useQuery(groupTodoByUser);
```

### [Powerful Middlewares](https://dataclient.io/docs/concepts/managers)

```ts
class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
}
```

```ts
class TickerStream implements Manager {
  middleware: Middleware = controller => {
    this.handleMsg = msg => {
      controller.set(Ticker, { id: msg.id }, msg);
    };
    return next => action => next(action);
  };

  init() {
    this.websocket = new WebSocket('wss://ws-feed.myexchange.com');
    this.websocket.onmessage = event => {
      const msg = JSON.parse(event.data);
      this.handleMsg(msg);
    };
  }
  cleanup() {
    this.websocket.close();
  }
}
```

### [Integrated data mocking](https://dataclient.io/docs/api/Fixtures)

```typescript
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { MockPlugin } from '@data-client/vue/test';

const app = createApp(App);
app.use(DataClientPlugin);
if (process.env.NODE_ENV !== 'production') {
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: ArticleResource.getList,
        args: [{ maxResults: 10 }] as const,
        response: [
          {
            id: '5',
            title: 'first post',
            body: 'have a merry christmas',
            author: { id: '10', username: 'bob' },
            createdAt: new Date(0).toISOString(),
          },
          {
            id: '532',
            title: 'second post',
            body: 'never again',
            author: { id: '10', username: 'bob' },
            createdAt: new Date(0).toISOString(),
          },
        ],
      },
      {
        endpoint: ArticleResource.update,
        response: ({ id }, body) => ({
          ...body,
          id,
        }),
      },
    ],
  });
}
app.mount('#app');
```

**Note:** `MockPlugin` must be installed after `DataClientPlugin` and before mounting the app.

### ...all typed ...fast ...and consistent

For the small price of 9kb gziped. &nbsp;&nbsp; [🏁Get started now](https://dataclient.io/docs/getting-started/installation)

## Features

- [x] ![TS](https://raw.githubusercontent.com/reactive/data-client/master/packages/vue/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🔄 Vue 3 [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) composables
- [x] 🎣 [Declarative API](https://dataclient.io/docs/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 [Normalized](https://dataclient.io/docs/concepts/normalization) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ Fast [optimistic updates](https://dataclient.io/rest/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://dataclient.io/docs/getting-started/resource) to fit any API design (one size fits all)
- [x] 🔧 [Debugging and inspection](https://dataclient.io/docs/getting-started/debugging) via browser extension
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 [Subscriptions](https://dataclient.io/docs/api/useSubscription)
- [x] 📙 [Storybook mocking](https://dataclient.io/docs/guides/storybook)
- [x] 🚯 [Declarative cache lifetime policy](https://dataclient.io/docs/concepts/expiry-policy)
- [x] 🧅 [Composable middlewares](https://dataclient.io/docs/api/Manager)
- [x] 💽 Global data consistency guarantees
- [x] 🏇 Automatic race condition elimination
- [x] 👯 Global referential equality guarantees

## API

- Rendering: `useSuspense()`, `useLive()`, `useCache()`, `useDLE()`, `useQuery()`, `useLoading()`, `useDebounce()`, `useCancelling()`
- Event handling: `useController()` returns [Controller](https://dataclient.io/docs/api/Controller)
  - `ctrl.fetch`
  - `ctrl.fetchIfStale`
  - `ctrl.expireAll`
  - `ctrl.invalidate`
  - `ctrl.invalidateAll`
  - `ctrl.resetEntireStore`
  - `ctrl.set`
  - `ctrl.setResponse`
  - `ctrl.setError`
  - `ctrl.resolve`
  - `ctrl.subscribe`
  - `ctrl.unsubscribe`
- Components: `<AsyncBoundary/>`, `<ErrorBoundary/>`
- Middleware: `LogoutManager`, `NetworkManager`, `SubscriptionManager`, `PollingSubscription`, `DevToolsManager`
