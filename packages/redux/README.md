# [![Reactive Data Client](./data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/redux.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/redux)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/redux?style=flat-square)](https://bundlephobia.com/result?p=@data-client/redux)
[![npm version](https://img.shields.io/npm/v/@data-client/redux.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/redux)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Asynchronous mutable data at scale. Performance, data integrity, and typing for [REST](https://dataclient.io/rest), proto, [GraphQL](https://dataclient.io/graphql), [websockets](https://dataclient.io/docs/api/Manager#data-stream) and [more](https://dataclient.io/docs/guides/img-media)..

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs/api/ExternalCacheProvider)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/guides/redux) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)

</div>

### Simple [TypeScript definition](https://dataclient.io/rest/api/Entity)

```typescript
class Article extends Entity {
  readonly id: string = '';
  readonly title: string = '';
  readonly body: string = '';

  pk() {
    return this.id;
  }
}
```

### Create [collection of API Endpoints](https://dataclient.io/rest/api/createResource)

```typescript
const ArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
})
```

### One line [data binding](https://dataclient.io/docs/api/useSuspense)

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

### And [subscriptions](https://dataclient.io/docs/api/useSubscription)

```tsx
const price = useSuspense(PriceResource.get, { symbol });
useSubscription(PriceResource.get, { symbol });
return price.value;
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```tsx
const sortedArticles = new schema.Query(
  new schema.All(Article),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
    if (asc) return sorted;
    return sorted.reverse();
  }
);

const articlesUnsorted = useQuery(sortedArticles);
const articlesAscending = useQuery(sortedArticles, { asc: true });
const articlesDescending = useQuery(sortedArticles, { asc: false });
```

### ...all typed ...fast ...and consistent

[🏁Get started now](https://dataclient.io/docs/getting-started/installation)

## Features

- [x] ![TS](./packages/data-client/typescript.svg?sanitize=true) Strong [Typescript](https://www.typescriptlang.org/) types
- [x] 🛌 React [Suspense](https://dataclient.io/docs/getting-started/data-dependency#boundaries) support
- [x] 🧵 React 18 [Concurrent mode](https://dataclient.io/docs/guides/render-as-you-fetch) compatible
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
- [x] 🚯 [Declarative cache lifetime policy](https://dataclient.io/docs/concepts/expiry-policy)

## Principals of Data Client

### ![TS](./packages/data-client/typescript.svg?sanitize=true) Integrity

- Strong inferred types
- Global referential equality guarantees
- Normalized store creates a single source of truth
- Strong invariants robust against race conditions
- Validation

### <svg height="25px" width="25px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 30 22.5" xml:space="preserve"><g transform="translate(-270 -140)"><g xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path fill="currentColor" d="M279,161c-0.736,0-1.375,0.405-1.722,1c-0.172,0.295-0.278,0.635-0.278,1c0,1.102,0.897,2,2,2c1.103,0,2-0.898,2-2    c0-0.365-0.105-0.705-0.278-1C280.375,161.405,279.737,161,279,161z"/><path fill="currentColor" d="M293,161c-0.736,0-1.375,0.405-1.722,1c-0.172,0.295-0.278,0.635-0.278,1c0,1.102,0.897,2,2,2c1.103,0,2-0.898,2-2    c0-0.365-0.105-0.705-0.278-1C294.375,161.405,293.737,161,293,161z"/><path fill="currentColor" d="M299,159v-1l-6-1.715L286,152h-11v1h6v1h-11v1h12v1h-10v1h5v1h-2v1h-4v1h5v1h-1v1h-3v1h4c0-0.352,0.072-0.686,0.184-1    c0.414-1.162,1.512-2,2.816-2c1.305,0,2.402,0.838,2.816,2c0.111,0.314,0.184,0.648,0.184,1h8c0-0.352,0.072-0.686,0.184-1    c0.414-1.162,1.512-2,2.816-2c1.305,0,2.402,0.838,2.816,2c0.111,0.314,0.184,0.648,0.184,1h3v-1h1v-3H299z"/></g></g></svg> Performance

- Stale While Revalidate configurable cache
- Only re-render

### <svg height="25px" viewBox="-10 0 512 512" width="25px" xmlns="http://www.w3.org/2000/svg"><path  fill="currentColor" d="m483 395.171875-38.734375-22.375v-79.640625l38.734375-22.375c9.566406-5.523438 12.839844-17.757812 7.316406-27.320312-5.527344-9.566407-17.757812-12.84375-27.324218-7.316407l-38.769532 22.394531-68.839844-39.746093v-79.542969l38.832032-22.421875c9.566406-5.519531 12.84375-17.753906 7.320312-27.316406-5.523437-9.566407-17.753906-12.847657-27.320312-7.320313l-38.832032 22.417969-68.882812-39.765625v-44.84375c0-11.046875-8.953125-20-20-20s-20 8.953125-20 20v44.84375l-68.882812 39.769531-38.835938-22.421875c-9.5625-5.523437-21.796875-2.246094-27.316406 7.320313-5.523438 9.566406-2.246094 21.796875 7.316406 27.320312l38.835938 22.421875v79.542969l-68.839844 39.742187-38.769532-22.394531c-9.566406-5.523437-21.796874-2.25-27.324218 7.316407-5.523438 9.5625-2.25 21.796874 7.316406 27.320312l38.734375 22.375v79.640625l-38.734375 22.375c-9.566406 5.523437-12.839844 17.753906-7.316406 27.320313 5.542968 9.597656 17.789062 12.824218 27.324218 7.316406l38.769532-22.394532 68.839844 39.746094v44.839844c0 11.046875 8.953124 20 20 20 11.046874 0 20-8.953125 20-20v-44.84375l68.882812-39.769531 68.882812 39.773437v44.839844c0 11.046875 8.957032 20 20 20 11.046876 0 20-8.953125 20-20v-44.84375l68.84375-39.746094 38.769532 22.394532c9.546875 5.515624 21.785156 2.269531 27.320312-7.3125 5.523438-9.566407 2.25-21.796876-7.316406-27.320313zm-256.5-22.425781-68.882812 39.769531-68.882813-39.769531v-79.542969l68.882813-39.769531 68.882812 39.773437zm-48.882812-153.953125v-79.539063l68.882812-39.769531 68.882812 39.769531v79.542969l-68.882812 39.765625zm226.648437 153.953125-68.882813 39.769531-68.882812-39.769531v-79.542969l68.882812-39.769531 68.882813 39.769531zm0 0"/></svg> Composition over configuration

- Declarative data definitions
- Decoupled API definitions from usage
- Co-located data dependencies
  - Centralized orchestration
- Extensible orchestration through Managers (middleware)
- Composable hooks
  - subject pattern
- Suspense + concurrent mode async orchestration

### <svg height="25px" width="25px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 189.667 189.667" style="enable-background:new 0 0 189.667 189.667;" xmlSpace="preserve"><path fill="currentColor" d="M184.667,160.301h-7.728V24.366c0-2.761-2.239-5-5-5h-24.5c-2.761,0-5,2.239-5,5v135.935h-8.136V43.96c0-2.761-2.239-5-5-5 h-24.5c-2.761,0-5,2.239-5,5v116.341h-8.136V74.366c0-2.761-2.239-5-5-5H62.166c-2.761,0-5,2.239-5,5v85.935H49.03v-57.935 c0-2.761-2.239-5-5-5H19.529c-2.761,0-5,2.239-5,5v57.935H5c-2.761,0-5,2.239-5,5s2.239,5,5,5h14.529H44.03h18.135h24.501h18.136 h24.5h18.136h24.5h12.728c2.761,0,5-2.239,5-5S187.428,160.301,184.667,160.301z" /></svg> Incremental Adoption

- Simple case is simple
- Scale as your app scales
