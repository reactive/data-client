<div align="center">
<a href="https://dataclient.io" target="_blank" rel="noopener">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/reactive/data-client/raw/master/website/static/img/client_logo_and_text-border--dark.svg?sanitize=true">
  <img alt="Reactive Data Client" src="https://github.com/reactive/data-client/raw/master/website/static/img/client_logo_and_text-border--light.svg?sanitize=true">
</picture>
</a>

The scalable way to build applications with [dynamic data](https://dataclient.io/docs/getting-started/mutations).

[Declarative resouce definitons](https://dataclient.io/docs/getting-started/resource) for [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/docs/concepts/managers#data-stream) and [more](https://dataclient.io/rest/api/Endpoint)
<br/>[Performant rendering](https://dataclient.io/docs/getting-started/data-dependency) in [React](https://react.dev/), [NextJS](https://nextjs.org/), [React Native](https://reactnative.dev/), [Expo](https://expo.dev/), [Vue](https://vuejs.org/)

Schema driven. Zero updater functions.

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/reactive/data-client.svg)](https://github.com/reactive/data-client/issues 'Percentage of issues still open')
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/react?style=flat-square)](https://bundlephobia.com/result?p=@data-client/react)
[![npm version](https://img.shields.io/npm/v/@data-client/react.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/react)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Codegen GPT](https://img.shields.io/badge/chatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white)](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp; [🤖Codegen](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen)<br/>🎮 Demos: &nbsp;
[Todo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[Github Social](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[NextJS SSR](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx) &nbsp;|&nbsp;
[Websockets+SSR](https://stackblitz.com/github/reactive/coin-app/tree/master?file=src%2Fresources%2FStreamManager.ts,src%2Fapp%2FCurrencyList.tsx)

</div>

## Installation

```bash
npm install --save @data-client/react @data-client/rest @data-client/test
```

For more details, see [the Installation docs page](https://dataclient.io/docs/getting-started/installation).

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

- [x] <img src="https://github.com/reactive/data-client/raw/master/packages/react/typescript.svg?sanitize=true" alt="TS" style="max-width: 100%;"> Strong [Typescript](https://www.typescriptlang.org/) inference
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

- Todo: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) | [![Edit on CodeSandbox](https://dataclient.io/img/third-party/play-codesandbox-small.svg)](https://codesandbox.io/p/devbox/github/reactive/data-client/tree/master/examples/todo-app)
- Github: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- NextJS: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx) | [![Edit on CodeSandbox](https://dataclient.io/img/third-party/play-codesandbox-small.svg)](https://codesandbox.io/p/devbox/github/reactive/data-client/tree/master/examples/nextjs)
- Websockets: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/coin-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/coin-app/tree/master?file=src%2Fresources%2FStreamManager.ts,src%2Fapp%2FCurrencyList.tsx) | [![Website](https://badgen.net/badge/icon/production?icon=vercel&label)](https://coin-app-lake.vercel.app)

## API

### Reactive Applications

- Rendering: [useSuspense()](https://dataclient.io/docs/api/useSuspense), [useLive()](https://dataclient.io/docs/api/useLive), [useCache()](https://dataclient.io/docs/api/useCache), [useDLE()](https://dataclient.io/docs/api/useDLE), [useQuery()](https://dataclient.io/docs/api/useQuery), [useLoading()](https://dataclient.io/docs/api/useLoading), [useDebounce()](https://dataclient.io/docs/api/useDebounce), [useCancelling()](https://dataclient.io/docs/api/useCancelling)
- Event handling: [useController()](https://dataclient.io/docs/api/useController) returns [Controller](https://dataclient.io/docs/api/Controller)
  <table>
  <thead>
  <tr>
  <th>Method</th>
  <th>Subject</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <th colSpan="2" align="center">Fetch</th>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#fetch">ctrl.fetch</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#fetchIfStale">ctrl.fetchIfStale</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <th colSpan="2" align="center">Expiry</th>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#expireAll">ctrl.expireAll</a></td>
  <td>Endpoint</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#invalidate">ctrl.invalidate</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#invalidateAll">ctrl.invalidateAll</a></td>
  <td>Endpoint</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#resetEntireStore">ctrl.resetEntireStore</a></td>
  <td>Everything</td>
  </tr>
  <tr>
  <th colSpan="2" align="center">Set</th>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#set">ctrl.set</a></td>
  <td>Schema + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#setResponse">ctrl.setResponse</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#setError">ctrl.setError</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#resolve">ctrl.resolve</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <th colSpan="2" align="center">Subscription</th>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#subscribe">ctrl.subscribe</a></td>
  <td>Endpoint + Args</td>
  </tr>
  <tr>
  <td><a href="https://dataclient.io/docs/api/Controller#unsubscribe">ctrl.unsubscribe</a></td>
  <td>Endpoint + Args</td>
  </tr>
  </tbody>
  </table>

- Components: [&lt;DataProvider/>](https://dataclient.io/docs/api/DataProvider), [&lt;AsyncBoundary/>](https://dataclient.io/docs/api/AsyncBoundary), [&lt;ErrorBoundary/>](https://dataclient.io/docs/api/ErrorBoundary), [&lt;MockResolver/>](https://dataclient.io/docs/api/MockResolver)
- Data Mocking: [Fixture](https://dataclient.io/docs/api/Fixtures#successfixture), [Interceptor](https://dataclient.io/docs/api/Fixtures#interceptor), [renderDataHook()](https://dataclient.io/docs/api/renderDataHook)
- Middleware: [LogoutManager](https://dataclient.io/docs/api/LogoutManager), [NetworkManager](https://dataclient.io/docs/api/NetworkManager), [SubscriptionManager](https://dataclient.io/docs/api/SubscriptionManager), [PollingSubscription](https://dataclient.io/docs/api/PollingSubscription), [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager)

### [Define Data](https://dataclient.io/docs/getting-started/resource)

#### Networking definition
- [Endpoints](https://dataclient.io/rest/api/Endpoint): [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint), [GQLEndpoint](https://dataclient.io/graphql/api/GQLEndpoint)
- [Resources](https://dataclient.io/docs/getting-started/resource): [resource()](https://dataclient.io/rest/api/resource), [hookifyResource()](https://dataclient.io/rest/api/hookifyResource)

<table>
<caption>
<a href="https://dataclient.io/docs/concepts/normalization">Data model</a>
</caption>
<thead>
<tr>
<th>Data Type</th>
<th>Mutable</th>
<th>Schema</th>
<th>Description</th>
<th><a href="https://dataclient.io/rest/api/schema#queryable">Queryable</a></th>
</tr>
</thead>
<tbody><tr>
<td rowSpan="4"><a href="https://en.wikipedia.org/wiki/Object_(computer_science)">Object</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Entity">Entity</a>, <a href="https://dataclient.io/rest/api/EntityMixin">EntityMixin</a></td>
<td>single <em>unique</em> object</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Union">Union(Entity)</a></td>
<td>polymorphic objects (<code>A | B</code>)</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Object">Object</a></td>
<td>statically known keys</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Invalidate">Invalidate(Entity)</a></td>
<td><a href="https://dataclient.io/docs/concepts/expiry-policy#invalidate-entity">delete an entity</a></td>
<td align="center">🛑</td>
</tr>
<tr>
<td rowSpan="3"><a href="https://en.wikipedia.org/wiki/List_(abstract_data_type)">List</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Array)</a></td>
<td>growable lists</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Array">Array</a></td>
<td>immutable lists</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center"> </td>
<td><a href="https://dataclient.io/rest/api/All">All</a></td>
<td>list of all entities of a kind</td>
<td align="center">✅</td>
</tr>
<tr>
<td rowSpan="2"><a href="https://en.wikipedia.org/wiki/Associative_array">Map</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Values)</a></td>
<td>growable maps</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Values">Values</a></td>
<td>immutable maps</td>
<td align="center">🛑</td>
</tr>
<tr>
<td>any</td>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Query">Query(Queryable)</a></td>
<td>memoized custom transforms</td>
<td align="center">✅</td>
</tr>
</tbody></table>
