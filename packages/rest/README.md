# Rest Hooks for REST

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/rest.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/rest)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/rest?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/rest)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/rest.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/rest)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

Extensible CRUD patterns for REST APIs.

<div align="center">

**[📖Read The Docs](https://resthooks.io/rest)** &nbsp;|&nbsp; [🎮Github Demo](https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?file=src%2Fresources%2FIssue.tsx)

</div>

### Simple TypeScript definition

```typescript
import { Entity, createResource } from '@rest-hooks/rest';

class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly body: string = '';

  pk() {
    return this.id;
  }
}
const ArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
});
```

[Entity](https://resthooks.io/rest/api/Entity) defines a data model.
[createResource](https://resthooks.io/rest/api/createResource) creates a [collection](https://resthooks.io/rest/api/createResource#members)
of six [RestEndpoints](https://resthooks.io/rest/api/RestEndpoint)

[RestEndpoints](https://resthooks.io/rest/api/RestEndpoint) are functions (and more) that return a Promise.
Both call parameters and return value are [automatically inferred](https://resthooks.io/rest/api/RestEndpoint#typing) from
the options used to construct them.

`path` is a templating language using [path-to-regex compile](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp).

### [Standard CRUD Endpoints](https://resthooks.io/rest/api/createResource#members)

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
const { fetch } = useController();
const updateArticle = data => fetch(ArticleResource.update, { id }, data);
const partialUpdateArticle = data =>
  fetch(ArticleResource.partialUpdate, { id }, data);
const createArticle = data => fetch(ArticleResource.create, data);
const deleteArticle = data => fetch(ArticleResource.delete, { id });
```

### Use with Node

```typescript
const article = await ArticleResource.get({ id: 5 });
const articles = await ArticleResource.getList();
```
### [Programmatic queries](https://resthooks.io/rest/api/Query)

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

### Prior Art

- [Backbone Model](https://backbonejs.org/#Model)
- [ImmutableJS Record](https://immutable-js.github.io/immutable-js/docs/#/Record)
