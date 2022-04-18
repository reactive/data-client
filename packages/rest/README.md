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
import { Resource } from '@rest-hooks/rest';

class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly body: string = '';

  pk() { return this.id; }
  static urlRoot = '/articles/';
}
```

### Standard CRUD Endpoints

#### Reads

```typescript
const article = useSuspense(ArticleResource.detail(), { id: 5 });
const articles = useSuspense(ArticleResource.list());
```

#### Mutates

```typescript
const { fetch } = useController();
const updateArticle = data => fetch(ArticleResource.update(), { id }, data);
const partialUpdateArticle = data => fetch(ArticleResource.partialUpdate(), { id }, data);
const createArticle = data => fetch(ArticleResource.create(), data);
const deleteArticle = data => fetch(ArticleResource.delete(), { id });
```

### DRY Customization

```typescript
import { HookableResource } from '@rest-hooks/rest';
import { useAuth } from 'my-auth-lib';

abstract class AuthdResource extends HookableResource {
  static useFetchInit = (init: RequestInit) => {
    const { session } = useAuth();
    return {
    ...options,
      headers: {
        ...options.headers,
        'Access-Token': session,
      },
    }
  };
}
```

```typescript
import type { ReadEndpoint, FetchFunction } from '@rest-hooks/endpoint';

import AuthdResource from './AuthdResource';

export default class UserResource extends AuthdResource {
  /** Retrieves current logged in user */
  static useCurrent<T extends typeof Resource>(this: T): ReadEndpoint<FetchFunction, T> {
    return super.useDetail().extend({ url: () => '/current_user' });
  }
}
```

### Prior Art

- [Backbone Model](https://backbonejs.org/#Model)
- [ImmutableJS Record](https://immutable-js.github.io/immutable-js/docs/#/Record)
