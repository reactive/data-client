# ![🛌🎣 Rest hooks](./rest_hooks_logo_and_text.svg?sanitize=true)
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)
[![bundle size](https://img.shields.io/bundlephobia/minzip/rest-hooks?style=flat-square)](https://bundlephobia.com/result?p=rest-hooks)
[![npm version](https://img.shields.io/npm/v/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Asynchronous dynamic data at scale. Performance, data integrity, and typing for [REST](https://resthooks.io/docs/rest/usage), proto, [GraphQL](https://resthooks.io/docs/graphql/usage), websockets and more.

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://resthooks.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app) &nbsp;|&nbsp;
[🎮Github Demo](https://github.com/coinbase/rest-hooks/tree/master/examples/github-app)

</div>

### Simple TypeScript definition

```typescript
class ArticleResource extends Resource {
  readonly id: string = '';
  readonly title: string = '';
  readonly body: string = '';

  pk() { return this.id; }
  static urlRoot = '/articles/';
}
```

### One line data hookup

```tsx
const article = useResource(ArticleResource.detail(), { id });
return (
  <>
    <h2>{article.title}</h2>
    <p>{article.body}</p>
  </>
);
```

### Mutation

```tsx
const { fetch } = useController();
return (
  <ArticleForm
    onSubmit={data => fetch(ArticleResource.update(), { id }, data)}
  />
);
```

### And subscriptions

```tsx
const price = useResource(PriceResource.detail(), { symbol });
useSubscription(PriceResource.detail(), { symbol });
return price.value;
```

### ...all typed ...fast ...and consistent

For the small price of 8kb gziped. &nbsp;&nbsp; [🏁Get started now](https://resthooks.io/docs/getting-started/installation)

## Features

- [x] ![TS](./typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) types
- [x] 🛌 React [Suspense](https://resthooks.io/docs/guides/loading-state) support
- [x] 🧵 React 18 [Concurrent mode](https://reactjs.org/docs/concurrent-mode-patterns.html) compatible
- [x] 🎣 [Declarative API](https://resthooks.io/docs/getting-started/data-dependency)
- [x] 📝 Composition over configuration
- [x] 💰 Normalized response [configurable](https://resthooks.io/docs/guides/resource-lifetime) caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ [Optimistic updates](https://resthooks.io/docs/guides/optimistic-updates)
- [x] 🧘 [Flexible](https://resthooks.io/docs/api/Endpoint) to fit any API design (one size fits all)
- [x] 🔧 [Debugging and inspection](https://resthooks.io/docs/guides/debugging) via browser extension
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 [Subscriptions](https://resthooks.io/docs/api/useSubscription)
- [x] ♻️ Optional [redux integration](https://resthooks.io/docs/guides/redux)
- [x] 📙 [Storybook mocking](https://resthooks.io/docs/guides/storybook)
- [x] 📱 [React Native](https://facebook.github.io/react-native/) support
- [x] 🚯 Declarative cache lifetime policy

## Principals of Rest Hooks

### Integrity

- Strong inferred types
- Global referential equality guarantees
- Normalized store creates a single source of truth
- Strong invariants robust against race conditions
- Validation

### Performance

- Stale While Revalidate configurable cache
- Only re-render

### Composition over configuration

- Declarative data definitions
- Decoupled API definitions from usage
- Co-located data dependencies
    - Centralized orchestration
- Extensible orchestration through Managers (middleware)
- Composable hooks
    - subject pattern
- Suspense + concurrent mode async orchestration

### Incremental Adoption

- Simple case is simple
- Scale as your app scales

## Special thanks

Thanks to [@0xcaff](https://github.com/0xcaff), [@melissafzhang](https://github.com/melissafzhang)
and [@alexiswolfish](https://github.com/alexiswolfish) for their valuable feedback.
