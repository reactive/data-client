# [![Reactive Data Client](./data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

[![CircleCI](https://circleci.com/gh/data-client/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/data-client/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/data-client/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/data-client/data-client?branch=master)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/data-client/data-client.svg)](https://github.com/data-client/data-client/issues "Percentage of issues still open")
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/react?style=flat-square)](https://bundlephobia.com/result?p=@data-client/react)
[![npm version](https://img.shields.io/npm/v/@data-client/react.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/react)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

Define your [async methods](https://dataclient.io/docs/getting-started/resource). Use them [synchronously in React](https://dataclient.io/docs/getting-started/data-dependency). [Instantly mutate](https://dataclient.io/docs/getting-started/mutations) the data and automatically update all usages.

For [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/docs/api/Manager#data-stream) and [more](https://dataclient.io/docs/guides/img-media)

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)

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

  pk() {
    return this.id;
  }
}

class Article extends Entity {
  id = '';
  title = '';
  body = '';
  author = User.fromJS();
  createdAt = new Date(0);

  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    createdAt: Date,
  };
}
```

### Create [collection of API Endpoints](https://dataclient.io/docs/getting-started/resource)

```typescript
const UserResource = createResource({
  path: '/users/:id',
  schema: User,
  optimistic: true,
});

const ArticleResource = createResource({
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
  <CreateProfileForm
    onSubmit={data => ctrl.fetch(UserResource.getList.push, { id }, data)}
  />
  <ProfileForm
    onSubmit={data => ctrl.fetch(UserResource.update, { id }, data)}
  />
  <button onClick={() => ctrl.fetch(UserResource.delete, { id })}>Delete</button>
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
ctrl.expireAll(ArticleResource.getList);
ctrl.invalidate(ArticleResource.get, { id });
ctrl.invalidateAll(ArticleResource.getList);
ctrl.setResponse(ArticleResource.get, { id }, articleData);
ctrl.fetch(ArticleResource.get, { id });
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```tsx
const queryTotalVotes = new Query(
  new schema.All(Post),
  (posts, { userId } = {}) => {
    if (userId !== undefined)
      posts = posts.filter(post => post.userId === userId);
    return posts.reduce((total, post) => total + post.votes, 0);
  },
);

const totalVotes = useCache(queryTotalVotes);
const totalVotesForUser = useCache(queryTotalVotes, { userId });
```

### [Powerful Middlewares](https://dataclient.io/docs/concepts/managers)

```ts
class LoggingManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
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

- [x] ![TS](./typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🛌 React [Suspense](https://dataclient.io/docs/getting-started/data-dependency#boundaries) support
- [x] 🧵 React 18 [Concurrent mode](https://dataclient.io/docs/guides/render-as-you-fetch) compatible
- [x] 💦 [Partial Hydration Server Side Rendering](https://dataclient.io/docs/guides/ssr)
- [x] 🎣 [Declarative API](https://dataclient.io/docs/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 [Normalized](https://dataclient.io/docs/concepts/normalization) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ [Optimistic updates](https://dataclient.io/rest/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://dataclient.io/docs/getting-started/resource) to fit any API design (one size fits all)
- [x] 🔧 [Debugging and inspection](https://dataclient.io/docs/guides/debugging) via browser extension
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 [Subscriptions](https://dataclient.io/docs/api/useSubscription)
- [x] ♻️ Optional [redux integration](https://dataclient.io/docs/guides/redux)
- [x] 📙 [Storybook mocking](https://dataclient.io/docs/guides/storybook)
- [x] 📱 [React Native](https://facebook.github.io/react-native/) support
- [x] ⚛️ [NextJS](https://dataclient.io/docs/guides/ssr#nextjs) support
- [x] 🚯 [Declarative cache lifetime policy](https://dataclient.io/docs/concepts/expiry-policy)
- [x] 🧅 [Composable middlewares](https://dataclient.io/docs/api/Manager)
- [x] 💽 Global data consistency guarantees
- [x] 🏇 Automatic race condition elimination
- [x] 👯 Global referential equality guarantees

## Examples

- Todo: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/data-client/data-client/tree/master/examples/todo-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/data-client/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx)
- Github: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/data-client/data-client/tree/master/examples/github-app) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- NextJS: [![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/data-client/data-client/tree/master/examples/nextjs) | [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/data-client/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)
