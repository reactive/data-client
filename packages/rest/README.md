# Data Client for REST

[![CircleCI](https://circleci.com/gh/data-client/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/data-client/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/data-client/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/data-client/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/rest.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/rest)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/rest?style=flat-square)](https://bundlephobia.com/result?p=@data-client/rest)
[![npm version](https://img.shields.io/npm/v/@data-client/rest.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/rest)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

Extensible CRUD patterns for REST APIs.

<div align="center">

**[📖Read The Docs](https://dataclient.io/rest)** &nbsp;|&nbsp; [🎮Github Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fresources%2FIssue.tsx)

</div>

### Simple TypeScript definition

```typescript
import { Entity, createResource } from '@data-client/rest';

class Article extends Entity {
  id: number | undefined = undefined;
  title = '';
  body = '';

  pk() {
    return this.id;
  }
}
const ArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
});
```

[Entity](https://dataclient.io/rest/api/Entity) defines a data model.
[createResource](https://dataclient.io/rest/api/createResource) creates a [collection](https://dataclient.io/rest/api/createResource#members)
of six [RestEndpoints](https://dataclient.io/rest/api/RestEndpoint)

[RestEndpoints](https://dataclient.io/rest/api/RestEndpoint) are functions (and more) that return a Promise.
Both call parameters and return value are [automatically inferred](https://dataclient.io/rest/api/RestEndpoint#typing) from
the options used to construct them.

`path` is a templating language using [path-to-regex compile](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp).

### [Standard CRUD Endpoints](https://dataclient.io/rest/api/createResource#members)

#### Reads

```typescript
const article = useSuspense(ArticleResource.get, { id: 5 });
const articles = useSuspense(ArticleResource.getList);
```

```typescript
const [article, setArticle] = useState();
useEffect(() => {
  setArticle(await ArticleResource.get({ id: 5 }));
}, []);
```

#### Mutates

```typescript
const ctrl = useController();
const updateArticle = data => ctrl.fetch(ArticleResource.update, { id }, data);
const partialUpdateArticle = data =>
  ctrl.fetch(ArticleResource.partialUpdate, { id }, data);
const createArticle = data => ctrl.fetch(ArticleResource.getList.push, data);
const deleteArticle = data => ctrl.fetch(ArticleResource.delete, { id });
```

### Use with Node

```typescript
const article = await ArticleResource.get({ id: 5 });
const articles = await ArticleResource.getList();
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```tsx
const sortedArticles = new Query(
  new schema.All(Article),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
    if (asc) return sorted;
    return sorted.reverse();
  },
);

const articlesUnsorted = useCache(sortedArticles);
const articlesAscending = useCache(sortedArticles, { asc: true });
const articlesDescending = useCache(sortedArticles, { asc: false });
```

### TypeScript requirements

TypeScript is optional, but will only work with 4.0 or above. 4.1 is needed for stronger types as it
supports inferring argument types from the path templates.

Version 5.x can be used for older TypeScript versions.

### Prior Art

- [Backbone Model](https://backbonejs.org/#Model)
- [ImmutableJS Record](https://immutable-js.github.io/immutable-js/docs/#/Record)
