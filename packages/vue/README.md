<h1>
<div align="center">
<a href="https://dataclient.io" target="_blank" rel="noopener">
  <img alt="Reactive Data Client" src="https://raw.githubusercontent.com/reactive/data-client/master/packages/vue/data_client_logo_and_text.svg?sanitize=true">
</a>
</div>
</h1>

The scalable way to build applications with [dynamic data](https://dataclient.io/vue/getting-started/mutations).

[Declarative resource definitions](https://dataclient.io/vue/getting-started/resource) for [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/vue/concepts/managers#data-stream) and [more](https://dataclient.io/rest/api/Endpoint)
<br/>[Performant rendering](https://dataclient.io/vue/getting-started/data-dependency) in [Vue 3](https://vuejs.org/)

Schema driven. Zero updater functions.

<div align="center">

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/reactive/data-client.svg)](https://github.com/reactive/data-client/issues 'Percentage of issues still open')
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/vue?style=flat-square)](https://bundlephobia.com/result?p=@data-client/vue)
[![npm version](https://img.shields.io/npm/v/@data-client/vue.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/vue)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-cc785c?style=flat-square&logo=claude&logoColor=white)](https://skills.sh/reactive/data-client)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

**[📖Read The Docs](https://dataclient.io/vue)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/vue/getting-started/agent-skills) &nbsp;|&nbsp; [🤖Agent Skills](https://skills.sh/reactive/data-client) &nbsp;|&nbsp; [🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/vue-todo-app?file=src%2Fcomponents%2FTodoListContent.vue)

</div>

## Installation

```bash
npm install --save @data-client/vue @data-client/rest
```

Install [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin) when creating your app:

```typescript
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin);
app.mount('#app');
```

For more details, see [the Getting Started docs page](https://dataclient.io/vue/getting-started/installation).

### Skills

```bash
npx skills add reactive/data-client
```

Then run [skill](https://agentskills.io) "data-client-setup"

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

### Create [collection of API Endpoints](https://dataclient.io/vue/getting-started/resource)

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

### One line [data binding](https://dataclient.io/vue/getting-started/data-dependency)

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

Components that `await` data render inside Vue's [&lt;Suspense>](https://vuejs.org/guide/built-ins/suspense.html), which shows a fallback while [loading](https://dataclient.io/vue/getting-started/data-dependency#async-fallbacks).

### [Reactive Mutations](https://dataclient.io/vue/getting-started/mutations)

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
  ctrl.fetch(ArticleResource.getList.push, article);

const handleUpdateProfile = (user: Partial<User>) =>
  ctrl.fetch(UserResource.update, { id: props.article.author.id }, user);

const handleDeleteArticle = () =>
  ctrl.fetch(ArticleResource.delete, { id: props.id });
</script>
```

### [Subscriptions](https://dataclient.io/vue/api/useLive)

```vue
<template>
  <div>{{ price.value }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ symbol: string }>();
const price = await useLive(PriceResource.get, { symbol: props.symbol });
</script>
```

### [Type-safe Imperative Actions](https://dataclient.io/vue/api/Controller)

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

### [Powerful Middlewares](https://dataclient.io/vue/concepts/managers)

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

### [Integrated data mocking](https://dataclient.io/vue/api/Fixtures)

```typescript
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { MockPlugin } from '@data-client/vue/test';

const app = createApp(App);
app.use(DataClientPlugin);
if (import.meta.env.DEV) {
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: ArticleResource.getList,
        args: [{ author: '10' }] as const,
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

### [Testing composables](https://dataclient.io/vue/guides/unit-testing-composables)

```typescript
import { renderDataCompose } from '@data-client/vue/test';

it('useSuspense() resolves an article', async () => {
  const { result, cleanup } = await renderDataCompose(
    () => useSuspense(ArticleResource.get, { id: '5' }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: '5' }],
          response: { id: '5', title: 'first post', body: 'hi' },
        },
      ],
    },
  );
  const article = await result;
  expect(article.value.title).toBe('first post');
  cleanup();
});
```

### ...all typed ...fast ...and consistent

For the small price of 9kb gzipped. &nbsp;&nbsp; [🏁Get started now](https://dataclient.io/vue/getting-started/agent-skills)

## Features

- [x] ![TS](https://raw.githubusercontent.com/reactive/data-client/master/packages/vue/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🔄 Vue 3 [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) composables
- [x] 🛌 Vue [Suspense](https://dataclient.io/vue/getting-started/data-dependency#boundaries) support
- [x] 🎣 [Declarative API](https://dataclient.io/vue/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 [Normalized](https://dataclient.io/vue/concepts/normalization) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ Fast [optimistic updates](https://dataclient.io/rest/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://dataclient.io/vue/getting-started/resource) to fit any API design (one size fits all)
- [x] 🔧 [Debugging and inspection](https://dataclient.io/vue/getting-started/debugging) via browser extension
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 [Subscriptions](https://dataclient.io/vue/api/useSubscription)
- [x] 🧪 [Fixture mocking](https://dataclient.io/vue/api/Fixtures) for [tests](https://dataclient.io/vue/guides/unit-testing-components) and development
- [x] 🚯 [Declarative cache lifetime policy](https://dataclient.io/vue/concepts/expiry-policy)
- [x] 🗑️ Automatic [garbage collection](https://dataclient.io/vue/api/DataClientPlugin#gcPolicy) of unused data
- [x] 🧅 [Composable middlewares](https://dataclient.io/vue/api/Manager)
- [x] 💽 Global data consistency guarantees
- [x] 🏇 Automatic race condition elimination
- [x] 👯 Global referential equality guarantees

## Examples

- Todo: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/vue-todo-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/vue-todo-app?file=src%2Fcomponents%2FTodoListContent.vue)

## API

- Setup: [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin), [getDefaultManagers()](https://dataclient.io/vue/api/getDefaultManagers)
- Rendering: [useSuspense()](https://dataclient.io/vue/api/useSuspense), [useLive()](https://dataclient.io/vue/api/useLive), [useCache()](https://dataclient.io/vue/api/useCache), [useDLE()](https://dataclient.io/vue/api/useDLE), [useQuery()](https://dataclient.io/vue/api/useQuery), [useFetch()](https://dataclient.io/vue/api/useFetch), [useSubscription()](https://dataclient.io/vue/api/useSubscription), [useLoading()](https://dataclient.io/vue/api/useLoading), [useDebounce()](https://dataclient.io/vue/api/useDebounce)
- Event handling: [useController()](https://dataclient.io/vue/api/useController) returns [Controller](https://dataclient.io/vue/api/Controller)
  - [ctrl.fetch](https://dataclient.io/vue/api/Controller#fetch)
  - [ctrl.fetchIfStale](https://dataclient.io/vue/api/Controller#fetchIfStale)
  - [ctrl.expireAll](https://dataclient.io/vue/api/Controller#expireAll)
  - [ctrl.invalidate](https://dataclient.io/vue/api/Controller#invalidate)
  - [ctrl.invalidateAll](https://dataclient.io/vue/api/Controller#invalidateAll)
  - [ctrl.resetEntireStore](https://dataclient.io/vue/api/Controller#resetEntireStore)
  - [ctrl.set](https://dataclient.io/vue/api/Controller#set)
  - [ctrl.setResponse](https://dataclient.io/vue/api/Controller#setResponse)
  - [ctrl.setError](https://dataclient.io/vue/api/Controller#setError)
  - [ctrl.resolve](https://dataclient.io/vue/api/Controller#resolve)
  - [ctrl.subscribe](https://dataclient.io/vue/api/Controller#subscribe)
  - [ctrl.unsubscribe](https://dataclient.io/vue/api/Controller#unsubscribe)
- Middleware: [LogoutManager](https://dataclient.io/vue/api/LogoutManager), [NetworkManager](https://dataclient.io/vue/api/NetworkManager), [SubscriptionManager](https://dataclient.io/vue/api/SubscriptionManager), [PollingSubscription](https://dataclient.io/vue/api/PollingSubscription), [DevToolsManager](https://dataclient.io/vue/api/DevToolsManager)
- Testing (`@data-client/vue/test`): [mountDataClient()](https://dataclient.io/vue/guides/unit-testing-components), [renderDataCompose()](https://dataclient.io/vue/guides/unit-testing-composables), `MockPlugin`, [mockInitialState()](https://dataclient.io/vue/api/mockInitialState)
