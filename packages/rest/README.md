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

**[📖Read The Docs](https://resthooks.io/docs/rest/usage)**

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

### Standard CRUD Endpoints

#### Reads

```typescript
const article = useSuspense(ArticleResource.get, { id: 5 });
const articles = useSuspense(ArticleResource.getList);
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

### Prior Art

- [Backbone Model](https://backbonejs.org/#Model)
- [ImmutableJS Record](https://immutable-js.github.io/immutable-js/docs/#/Record)
