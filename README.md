# 🛌🎣 Rest hooks
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)
[![gzip size](https://img.badgesize.io/https://unpkg.com/rest-hooks?compression=gzip&style=flat-square)](https://unpkg.com/rest-hooks)
[![npm version](https://img.shields.io/npm/v/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Making dynamic sites performant, scalable, simple to build with any API design.

<div align="center">

**[📖Read The Docs](docs)** &nbsp;|&nbsp; [🏁Getting Started](docs/getting-started/installation.md) &nbsp;|&nbsp;
[🎮Demo](https://stackblitz.com/edit/rest-hooks)

</div>

### Simple TypeScript definition

```typescript
class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly body: string = '';

  pk() { return this.id; }
  static urlRoot = '/articles/';
}
```

### One line data hookup

```tsx
const article = useResource(ArticleResource.singleRequest(), { id });
return (
  <>
    <h2>{article.title}</h2>
    <p>{article.body}</p>
  </>
);
```

### Mutation

```tsx
const update = useFetcher(ArticleResource.updateRequest());
return <ArticleForm onSubmit={data => update(data, { id })} />;
```

### And subscriptions

```tsx
const price = useResource(PriceResource.singleRequest(), { symbol });
useSubscription(PriceResource.singleRequest(), { symbol });
return price.value;
```

### ...all typed ...fast ...and consistent

For the small price of 7kb gziped. &nbsp;&nbsp; [🏁Get started now](docs/getting-started/installation.md)

## Features

- [x] ![TS](typescript.svg) Strong [Typescript](https://www.typescriptlang.org/) types
- [x] 🛌 React [Suspense](https://www.youtube.com/watch?v=ByBPyMBTzM0) support
- [x] 🎣 Simple declarative API
- [x] 💰 Normalized response caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ Optimistic updates
- [x] 🧘 Flexible to fit any API design (one size fits all)
- [x] 🌳 Tree-shakable (only use what you need)
- [x] 🔁 Subscriptions
- [ ] 🚯 Pluggable garbage collection policy
- [ ] ♻️ Optional [redux](https://redux.js.org/) integration
- [ ] 📙 [Storybook](https://storybook.js.org/) mocking


### Special thanks

Thanks to [@0xcaff](https://github.com/0xcaff), [@melissafzhang](https://github.com/melissafzhang)
and [@alexiswolfish](https://github.com/alexiswolfish) for their valuable feedback.
