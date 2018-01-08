# 🛌🎣 Rest hooks [![build status](https://img.shields.io/travis/coinbase/rest-hooks/master.svg?style=flat-square)](https://travis-ci.org/coinbase/rest-hooks) [![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks/master.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master) [![JS gzip size](https://img.badgesize.io/https://unpkg.com/rest-hooks.js?compression=gzip&label=JS+gzip+size)](https://unpkg.com/rest-hooks.js) [![npm version](https://img.shields.io/npm/v/rest-hooks.svg?style=flat-square)](https://www.npmjs.com/package/rest-hooks)

Making dynamic sites performant, scalable, simple to build with almost any API design.

<div align="center">

**[📖Read The Docs](docs)** &nbsp;|&nbsp; [🏁Getting Started](docs/getting-started/installation.md)

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

### And mutation

```tsx
const update = useDispatch(ArticleResource.updateRequest(), { id });
return <ArticleForm onSubmit={update} />;
```

### ...all typed ...fast ...and consistent

For the small price of 6kb gziped. &nbsp;&nbsp; [🏁Get started now](docs/getting-started/installation.md)

## Features

- [x] ![TypeScript](typescript.svg) Strong [Typescript](https://www.typescriptlang.org/) types
- [x] 🚦 React [Suspense](https://www.youtube.com/watch?v=ByBPyMBTzM0) support
- [x] 🎣 Simple declarative API
- [x] 💰 Normalized response caching
- [x] 💥 Tiny bundle footprint
- [x] 🛑 Automatic overfetching elimination
- [x] ✨ Optimistic updates
- [x] 🧘 Flexible to fit any API design (one size fits all)
- [ ] 🚯 Pluggable garbage collection policy
- [ ] 🔁 Subscriptions
- [ ] ♻️ Optional [redux](https://redux.js.org/) integration
- [ ] 📙 [Storybook](https://storybook.js.org/) mocking
