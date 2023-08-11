# [![🛌🎣 Rest hooks](./proxy-pkgs/react/rest_hooks_logo_and_text.svg?sanitize=true)](https://resthooks.io)

[![CircleCI](https://circleci.com/gh/data-client/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/data-client/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/data-client/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/data-client/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dt/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/react?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/react)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/react.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/react)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

Define your [async methods](https://resthooks.io/docs/getting-started/endpoint). Use them [synchronously in React](https://resthooks.io/docs/getting-started/data-dependency). [Instantly mutate](https://resthooks.io/docs/getting-started/mutations) the data and automatically update all usages.

For [REST](https://resthooks.io/rest), [GraphQL](https://resthooks.io/graphql), [Websockets+SSE](https://resthooks.io/docs/api/Manager#data-stream) and [more](https://resthooks.io/docs/guides/img-media)

<div align="center">

## 🌎 [Website](https://resthooks.io)

</div>

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://resthooks.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)

</div>

## Installation

```bash
npm install --save @rest-hooks/react @rest-hooks/rest @rest-hooks/test
```

For more details, see [the Installation docs page](https://resthooks.io/docs/getting-started/installation).

## Usage

### Simple [TypeScript definition](https://resthooks.io/rest/api/Entity)

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

### Create [collection of API Endpoints](https://resthooks.io/rest/api/createResource)

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
});
```

### One line [data binding](https://resthooks.io/docs/getting-started/data-dependency)

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

### [Reactive Mutations](https://resthooks.io/docs/getting-started/mutations)

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

### [Subscriptions](https://resthooks.io/docs/api/useLive)

```tsx
const price = useLive(PriceResource.get, { symbol });
return price.value;
```

### [Type-safe Imperative Actions](https://resthooks.io/docs/api/Controller)

```tsx
const ctrl = useController();
ctrl.expireAll(ArticleResource.getList);
ctrl.invalidate(ArticleResource.get, { id });
ctrl.invalidateAll(ArticleResource.getList);
ctrl.setResponse(ArticleResource.get, { id }, articleData);
ctrl.fetch(ArticleResource.get, { id });
```

### [Programmatic queries](https://resthooks.io/rest/api/Query)

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

### [Powerful Middlewares](https://resthooks.io/docs/concepts/managers)

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

### [Integrated data mocking](https://resthooks.io/docs/api/Fixtures)

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

For the small price of 9kb gziped. &nbsp;&nbsp; [🏁Get started now](https://resthooks.io/docs/getting-started/installation)
| [🥊Comparison](https://resthooks.io/docs/getting-started/comparison)

## Features

- [x] ![TS](./packages/rest-hooks/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🛌 React [Suspense](https://resthooks.io/docs/getting-started/data-dependency#boundaries) support
- [x] 🧵 React 18 [Concurrent mode](https://resthooks.io/docs/guides/render-as-you-fetch) compatible
- [x] 💦 [Partial Hydration Server Side Rendering](https://resthooks.io/docs/guides/ssr)
- [x] 🎣 [Declarative API](https://resthooks.io/docs/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 [Normalized](https://resthooks.io/docs/concepts/normalization) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ [Optimistic updates](https://resthooks.io/rest/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://resthooks.io/docs/getting-started/endpoint) to fit any API design (one size fits all)
- [x] 🔧 [Debugging and inspection](https://resthooks.io/docs/guides/debugging) via browser extension
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 [Subscriptions](https://resthooks.io/docs/api/useSubscription)
- [x] ♻️ Optional [redux integration](https://resthooks.io/docs/guides/redux)
- [x] 📙 [Storybook mocking](https://resthooks.io/docs/guides/storybook)
- [x] 📱 [React Native](https://facebook.github.io/react-native/) support
- [x] ⚛️ [NextJS](https://resthooks.io/docs/guides/ssr#nextjs) support
- [x] 🚯 [Declarative cache lifetime policy](https://resthooks.io/docs/concepts/expiry-policy)
- [x] 🧅 [Composable middlewares](https://resthooks.io/docs/api/Manager)
- [x] 💽 Global data consistency guarantees
- [x] 🏇 Automatic race condition elimination
- [x] 👯 Global referential equality guarantees

## Examples

- Todo: [Source](https://github.com/data-client/rest-hooks/tree/master/examples/todo-app) | [Sandbox](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx)
- Github: [Source](https://github.com/data-client/rest-hooks/tree/master/examples/github-app) | [Sandbox](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- NextJS: [Source](https://github.com/data-client/rest-hooks/tree/master/examples/nextjs) | [Sandbox](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)
