<h1>
<div align="center">
<a href="https://dataclient.io" target="_blank" rel="noopener">
  <img alt="Reactive Data Client" src="https://raw.githubusercontent.com/reactive/data-client/master/packages/react/data_client_logo_and_text.svg?sanitize=true">
</a>
</div>
</h1>

The scalable way to build applications with [dynamic data](https://dataclient.io/docs/getting-started/mutations).

[Declarative resouce definitons](https://dataclient.io/docs/getting-started/resource) for [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/docs/concepts/managers#data-stream) and [more](https://dataclient.io/rest/api/Endpoint)
<br/>[Performant rendering](https://dataclient.io/docs/getting-started/data-dependency) in [React](https://react.dev/), [NextJS](https://nextjs.org/), [React Native](https://reactnative.dev/), [Expo](https://expo.dev/)

Schema driven. Zero updater functions.

<div align="center">

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/reactive/data-client.svg)](https://github.com/reactive/data-client/issues 'Percentage of issues still open')
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/react?style=flat-square)](https://bundlephobia.com/result?p=@data-client/react)
[![npm version](https://img.shields.io/npm/v/@data-client/react.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/react)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Codegen GPT](https://img.shields.io/badge/chatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white)](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp; [🤖Codegen](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen) <br/>🎮 **Demos:** &nbsp;
[Todo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[Github](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[NextJS SSR](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx) &nbsp;|&nbsp;
[Websockets+SSR](https://coin-app-lake.vercel.app)

</div>

## Installation

```bash
npm install --save @data-client/react @data-client/rest @data-client/test
```

For more details, see [the Installation docs page](https://dataclient.io/docs/getting-started/installation).

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

```tsx
const article = useSuspense(ArticleResource.get, { id });
return (
  <article>
    <h2>
      {article.title} by {article.author.username}
    </h2>
    <p>{article.body}</p>
  </article>
);
```

### [Reactive Mutations](https://dataclient.io/docs/getting-started/mutations)

```tsx
const ctrl = useController();
return (
  <>
    <CreateArticleForm
      onSubmit={article =>
        ctrl.fetch(ArticleResource.getList.push, { id }, article)
      }
    />
    <ProfileForm
      onSubmit={user =>
        ctrl.fetch(UserResource.update, { id: article.author.id }, user)
      }
    />
    <button onClick={() => ctrl.fetch(ArticleResource.delete, { id })}>
      Delete
    </button>
  </>
);
```

### [Subscriptions](https://dataclient.io/docs/api/useLive)

```tsx
const price = useLive(PriceResource.get, { symbol });
return price.value;
```

### [Type-safe Imperative Actions](https://dataclient.io/docs/api/Controller)

```tsx
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

```tsx
const fixtures = [
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
];

const Story = () => (
  <MockResolver fixtures={options[result]}>
    <ArticleList maxResults={10} />
  </MockResolver>
);
```

### ...all typed ...fast ...and consistent

For the small price of 9kb gziped. &nbsp;&nbsp; [🏁Get started now](https://dataclient.io/docs/getting-started/installation)

## Features

- [x] ![TS](https://raw.githubusercontent.com/reactive/data-client/master/packages/react/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🛌 React [Suspense](https://dataclient.io/docs/getting-started/data-dependency#boundaries) support
- [x] 🧵 React 18 [Concurrent mode](https://dataclient.io/docs/guides/render-as-you-fetch) compatible
- [x] 💦 [Partial Hydration Server Side Rendering](https://dataclient.io/docs/guides/ssr)
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
- [x] ♻️ Optional [redux integration](https://dataclient.io/docs/guides/redux)
- [x] 📙 [Storybook mocking](https://dataclient.io/docs/guides/storybook)
- [x] 📱 [React Native](https://facebook.github.io/react-native/) support
- [x] 📱 [Expo](https://dataclient.io/docs/getting-started/installation) support
- [x] ⚛️ [NextJS](https://dataclient.io/docs/guides/ssr#nextjs) support
- [x] 🚯 [Declarative cache lifetime policy](https://dataclient.io/docs/concepts/expiry-policy)
- [x] 🧅 [Composable middlewares](https://dataclient.io/docs/api/Manager)
- [x] 💽 Global data consistency guarantees
- [x] 🏇 Automatic race condition elimination
- [x] 👯 Global referential equality guarantees

## Examples

- Todo: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx)
- Github: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- NextJS: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)
- Websockets: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/coin-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/coin-app/tree/master?file=src%2Fresources%2FStreamManager.ts,src%2Fapp%2FCurrencyList.tsx) | [![Website](https://badgen.net/badge/icon/production?icon=vercel&label)](https://coin-app-lake.vercel.app)

## API

- Rendering: [useSuspense()](https://dataclient.io/docs/api/useSuspense), [useLive()](https://dataclient.io/docs/api/useLive), [useCache()](https://dataclient.io/docs/api/useCache), [useDLE()](https://dataclient.io/docs/api/useDLE), [useQuery()](https://dataclient.io/docs/api/useQuery), [useLoading()](https://dataclient.io/docs/api/useLoading), [useDebounce()](https://dataclient.io/docs/api/useDebounce), [useCancelling()](https://dataclient.io/docs/api/useCancelling)
- Event handling: [useController()](https://dataclient.io/docs/api/useController) returns [Controller](https://dataclient.io/docs/api/Controller)
  - [ctrl.fetch](https://dataclient.io/docs/api/Controller#fetch)
  - [ctrl.fetchIfStale](https://dataclient.io/docs/api/Controller#fetchIfStale)
  - [ctrl.expireAll](https://dataclient.io/docs/api/Controller#expireAll)
  - [ctrl.invalidate](https://dataclient.io/docs/api/Controller#invalidate)
  - [ctrl.invalidateAll](https://dataclient.io/docs/api/Controller#invalidateAll)
  - [ctrl.resetEntireStore](https://dataclient.io/docs/api/Controller#resetEntireStore)
  - [ctrl.set](https://dataclient.io/docs/api/Controller#set)
  - [ctrl.setResponse](https://dataclient.io/docs/api/Controller#setResponse)
  - [ctrl.setError](https://dataclient.io/docs/api/Controller#setError)
  - [ctrl.resolve](https://dataclient.io/docs/api/Controller#resolve)
  - [ctrl.subscribe](https://dataclient.io/docs/api/Controller#subscribe)
  - [ctrl.unsubscribe](https://dataclient.io/docs/api/Controller#unsubscribe)
- Components: [&lt;DataProvider/>](https://dataclient.io/docs/api/DataProvider), [&lt;AsyncBoundary/>](https://dataclient.io/docs/api/AsyncBoundary), [&lt;ErrorBoundary/>](https://dataclient.io/docs/api/ErrorBoundary)
- Middleware: [LogoutManager](https://dataclient.io/docs/api/LogoutManager), [NetworkManager](https://dataclient.io/docs/api/NetworkManager), [SubscriptionManager](https://dataclient.io/docs/api/SubscriptionManager), [PollingSubscription](https://dataclient.io/docs/api/PollingSubscription), [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager)
