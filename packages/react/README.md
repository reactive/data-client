# [![Reactive Data Client](./data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

[![CircleCI](https://circleci.com/gh/data-client/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/data-client/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/data-client/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/data-client/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/react.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/react?style=flat-square)](https://bundlephobia.com/result?p=@data-client/react)
[![npm version](https://img.shields.io/npm/v/@data-client/react.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/react)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Define your [async methods](https://dataclient.io/docs/getting-started/endpoint ). Use them [synchronously in React](https://dataclient.io/docs/getting-started/data-dependency). [Instantly mutate](https://dataclient.io/docs/getting-started/mutations) the data and automatically update all usages.

For [REST](https://dataclient.io/rest), [GraphQL](https://dataclient.io/graphql), [Websockets+SSE](https://dataclient.io/docs/api/Manager#middleware-data-stream) and [more](https://dataclient.io/docs/guides/img-media)

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)

</div>

## Installation

```bash
npm install @data-client/react @data-client/rest @data-client/test
```

For more details, see [the Installation docs page](https://dataclient.io/docs/getting-started/installation).

### Simple [TypeScript definition](https://dataclient.io/rest/api/Entity)

```typescript
class Article extends Entity {
  id = '';
  title = '';
  body = '';

  pk() {
    return this.id;
  }
}
```

### Create [collection of API Endpoints](https://dataclient.io/docs/getting-started/resource)

```typescript
const ArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
})
```

### One line [data binding](https://dataclient.io/docs/getting-started/data-dependency)

```tsx
const article = useSuspense(ArticleResource.get, { id });
return (
  <>
    <h2>{article.title}</h2>
    <p>{article.body}</p>
  </>
);
```

### [Mutation](https://dataclient.io/docs/getting-started/mutations)

```tsx
const ctrl = useController();
return (
  <ArticleForm
    onSubmit={data => ctrl.fetch(ArticleResource.update, { id }, data)}
  />
);
```

### [Subscriptions](https://dataclient.io/docs/api/useLive)

```tsx
const price = useLive(PriceResource.get, { symbol });
return price.value;
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```tsx
const sortedArticles = new Query(
  new schema.All(Article),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
    if (asc) return sorted;
    return sorted.reverse();
  }
);

const articlesUnsorted = useCache(sortedArticles);
const articlesAscending = useCache(sortedArticles, { asc: true });
const articlesDescending = useCache(sortedArticles, { asc: false });
```

### ...all typed ...fast ...and consistent

For the small price of 9kb gziped. &nbsp;&nbsp; [🏁Get started now](https://dataclient.io/docs/getting-started/installation) | [🥊Comparison](https://dataclient.io/docs/getting-started/comparison)

## Features

- [x] ![TS](./packages/data-client/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) inference
- [x] 🛌 React [Suspense](https://dataclient.io/docs/getting-started/data-dependency#boundaries) support
- [x] 🧵 React 18 [Concurrent mode](https://dataclient.io/docs/guides/render-as-you-fetch) compatible
- [x] 💦 [Partial Hydration Server Side Rendering](https://dataclient.io/docs/guides/ssr)
- [x] 🎣 [Declarative API](https://dataclient.io/docs/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 [Normalized](https://dataclient.io/docs/concepts/normalization) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ [Optimistic updates](https://dataclient.io/rest/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://dataclient.io/docs/getting-started/endpoint) to fit any API design (one size fits all)
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

- Todo: [Source](https://github.com/data-client/data-client/tree/master/examples/todo-app) | [Sandbox](https://stackblitz.com/github/data-client/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx)
- Github: [Source](https://github.com/data-client/data-client/tree/master/examples/github-app) | [Sandbox](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- NextJS: [Source](https://github.com/data-client/data-client/tree/master/examples/nextjs) | [Sandbox](https://stackblitz.com/github/data-client/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)
