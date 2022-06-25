---
title: Upgrading from 4 to 5
---
import BeforeAfterTabs from '@site/src/components/BeforeAfterTabs';


## Deprecation Removals

These previously deprecated members have been removed:

<details><summary>Resource.getKey() -> Resource.key</summary>

Simply rename this to `get key()`

</details>

<details><summary>Resource.getEntitySchema() -> Resource</summary>

This has been simplified to simply use the Resource itself:

<BeforeAfterTabs>

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this.getEntitySchema()], nextPage: '' },
    };
  }
}
```

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this], nextPage: '' },
    };
  }
}
```

</BeforeAfterTabs>

</details>

## Other breaking changes

<details><summary>yarn add @rest-hooks/test@2 @rest-hooks/legacy@2</summary>

Be sure to also upgrade these libraries if you use them:

- `@rest-hooks/test@2`
- `@rest-hooks/legacy@2`

These libraries don't have any breaking changes within themselves, but
they do require `rest-hooks@5` and (reflexively) `rest-hooks@5` requires
at least v2.

</details>

### Network Definitions (Resource/FetchShape, etc)

<details><summary>FetchShape: &#123;type: 'delete'&#125; -> &#123; type: 'mutate', schema: new schemas.Delete(this) &#125;</summary>

`Resource.deleteShape()` will continue to work as expected. However, if
you defined some custom shapes with type: 'delete'

<BeforeAfterTabs>

```typescript
class MyResource extends Resource {
  static someOtherDeleteShape<T extends typeof Resource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    const options = this.getFetchOptions();
    return {
      // changed
      type: 'delete',
      // changed
      schema: this.asSchema(),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
      },
    };
  }
}
```


```typescript
import { schemas } from 'rest-hooks';
class MyResource extends Resource {
  static someOtherDeleteShape<T extends typeof Resource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    const options = this.getFetchInit();
    return {
      // changed
      type: 'mutate',
      // changed
      schema: new schemas.Delete(this),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
      },
    };
  }
}
```

</BeforeAfterTabs>

</details>

<details><summary>Validation Errors: `This is likely due to a malformed response`</summary>

To aid with common schema definition or networking errors, Rest Hooks
will sometimes throw an error. This only occurs during development, to
help users correctly define their schemas and endpoints.

While the heuristics have been heavily tuned, if you don't believe
the errors reported are valid please [report a bug](https://github.com/coinbase/rest-hooks/issues/new/choose).

When reporting, be sure to include

- The exact network response from the [network inspector](https://developers.google.com/web/tools/chrome-devtools/network)
- The full schema definition.

Alternatively, this can be disabled by adding `static automaticValidation = 'silent' | 'warn'`

```typescript
class MyResource extends Resource {
  static automaticValidation = 'silent' as const;
  // ...
}
```

Warn will no longer throw an error, but still add a message to the browser console.
Silent removes the check completely.

</details>

### Imports

<details><summary>{`import { reducer, NetworkManager } from '@rest-hooks/core'`}</summary>

Many 'advanced' features of rest-hooks are not longer exported by 'rest-hooks' package itself, but require importing from [@rest-hooks/core](https://www.npmjs.com/package/@rest-hooks/core)

- reducer
- NetworkManager
- action creators:
  - createFetch
  - createReceive
  - createReceiveError

</details>

### Managers

These only apply if you have a custom [Manager](../api/Manager)

<details><summary>action.meta.url -> action.meta.key</summary>

It's recommend to now use the action creators
exported from `@rest-hooks/core`

- createFetch
- createReceive
- createReceiveError

</details>

<details><summary>getState()</summary>

This is very unlikely to make a difference, but the internal cache state
(accessible with getState()) might be slightly different. Mutations now
result in entries in `meta` and `results`. This brings them more in line with
reads, making the distinction simply about which hooks they are allowed
in. (To prevent unwanted side effects.)

</details>

### Cache Lifetime Policy

<details><summary>useInvalidator() triggers suspense</summary>

You can likely remove [invalidIfStale](/rest/api/Endpoint#invalidifstale-boolean) if used in conjunction with [useInvalidator()](../api/useInvalidator)

[invalidIfStale](/rest/api/Endpoint#invalidifstale-boolean) is still useful to disable the `stale-while-revalidate` policy.

</details>

<details><summary>`delete` suspends instead of throwing 404</summary>

[Delete](/docs/5.0/api/Delete) marks an entity as deleted. _Any_ response requiring
that entity will suspend. Previously it throw a 404 error.

</details>

<details><summary>Missing entities suspend</summary>

Required entities missing from network response will now throw error in useSuspense() just like other unexpected deserializations.

Use [SimpleRecord](/docs/5.0/api/SimpleRecord) for [optional entities](/docs/5.0/api/SimpleRecord#optional-members).

<BeforeAfterTabs>

```typescript
const schema = {
  data: MyEntity,
};
```

```typescript
class OptionalSchema extends SimpleRecord {
  readonly data: MyEntity | null = null;

  static schema = {
    data: MyEntity,
  };
}
const schema = OptionalSchema;
```

</BeforeAfterTabs>

</details>

<details><summary>invalidIfStale</summary>

When [invalidIfStale](/rest/api/Endpoint#invalidifstale-boolean) is true, useCache() and useStatefulResource() will no longer return entities, even if they are in the cache.
This matches the expected behavior that any `loading` data should not be usable.

</details>

## Upgrading from beta versions to final

The last breaking changes introduced to `rest-hook` were in `delta.0` where TTL
and deletes were reworked. If you are on a more recent beta (`i`, `j`, `k`, `rc`),
upgrades should be as simple as updating the version.

If this is not the case, please [report a bug](https://github.com/coinbase/rest-hooks/issues/new/choose).

## Deprecations

After a successful upgrade, it is recommended to adopt the modern practices.

<details><summary>Resource.fetchOptionsPlugin() -> Resource.getFetchInit()</summary>

<BeforeAfterTabs>

```typescript
class AuthdResource extends Resource {
  static fetchOptionsPlugin = (options: RequestInit) => ({
    ...options,
    credentials: 'same-origin',
  });
}
```

<!--after-->

```typescript
class AuthdResource extends Resource {
  static getFetchInit = (init: RequestInit) => ({
    ...init,
    credentials: 'same-origin',
  });
}
```

</BeforeAfterTabs>

(Resource.getFetchInit())/rest/api/resource#static-getfetchinitinit-requestinit-requestinit)

</details>

<details><summary>Resource.getFetchOptions() -> Resource.getEndpointExtra()</summary>

<BeforeAfterTabs>

```typescript
class PollingResource extends Resource {
  static getFetchOptions(): FetchOptions {
    return {
      pollFrequency: 5000, // every 5 seconds
    };
  }
}
```

<!--after-->

```typescript
class PollingResource extends Resource {
  static getEndpointExtra(): FetchOptions {
    return {
      pollFrequency: 5000, // every 5 seconds
    };
  }
}
```

</BeforeAfterTabs>

(Resource.getEndpointExtra())/rest/api/resource#static-getendpointextra--endpointextraoptions--undefined)

</details>

<details><summary>Resource.asSchema() -> Resource</summary>

This has been simplified to simply use the Resource itself:

<BeforeAfterTabs>

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this.asSchema()], nextPage: '' },
    };
  }
}
```

<!--after-->

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this], nextPage: '' },
    };
  }
}
```

</BeforeAfterTabs>

</details>

### @rest-hooks/legacy

For v5 of Rest Hooks, the existing `Resource` and `SimpleResource` classes will
be exported.

In v6, this will no longer be the case. However, they will continue to live in `@rest-hooks/legacy`, allowing
easy safe upgrade to v6 by simply changing the import path. However, it is still recommended to
try to migrate to `@rest-hooks/rest` as this is the future. v1 of @rest-hooks/rest will be the easiest to
start with.

<details><summary>yarn add @rest-hooks/legacy</summary>

<BeforeAfterTabs>

```typescript
import { Resource } from 'rest-hooks';

class MyResource extends Resource {}
```

<!--after-->

```typescript
import { Resource } from '@rest-hooks/legacy';

class MyResource extends Resource {}
```

</BeforeAfterTabs>

</details>

### @rest-hooks/rest

Rest Hooks is protocol agnostic, so the REST/CRUD specific class [Resource](/rest/api/resource)
will eventually be fully deprecated and removed. `@rest-hooks/rest` is intended as its
replacement. Other supplementary libraries like `@rest-hooks/graphql` could be
added in the future, for intance. This is also beneficial as these libraries
change more frequently than the core of rest hooks.

<details><summary>yarn add @rest-hooks/rest</summary>

<BeforeAfterTabs>

```typescript
import { Resource } from 'rest-hooks';

class MyResource extends Resource {}
```

<!--after-->

```typescript
import { Resource } from '@rest-hooks/rest';

class MyResource extends Resource {}
```

</BeforeAfterTabs>

> Breaking change:
>
> Nested entities `static schema` will return from `useSuspense()`

</details>

<details><summary>static schema</summary>

[Nesting](/rest/guides/nested-response) entities inside a schema will now denormalize those nested items.

<BeforeAfterTabs>

```typescript
import { Resource } from 'rest-hooks';

class ArticleResource extends Resource {
  // other stuff omitted
  readonly user: string = '';

  static schema = {
    user: UserResource,
  };
}
```

```typescript
const article = useSuspense(ArticleResource.detail(), { id });
const user = useCache(UserResource.detail(), { id: article.user });
```

<!--after-->

```typescript
import { Resource } from '@rest-hooks/rest';

class ArticleResource extends Resource {
  // other stuff omitted
  readonly user: UserResource = UserResource.fromJS({});

  static schema = {
    user: UserResource,
  };
}
```

```typescript
const article = useSuspense(ArticleResource.detail(), { id });
const user = article.user;
```

</BeforeAfterTabs>

</details>

<details><summary>FetchShape -> Endpoint</summary>

[Endpoints](/rest/api/Endpoint) use the builder pattern to make customization easy. Use [extend()](/rest/api/Endpoint#extendendpointoptions-endpoint) to customize.

[@rest-hooks/endpoint](https://www.npmjs.com/package/@rest-hooks/endpoint) is also its own package. This empowers you to publish interfaces for public APIs by marking [@rest-hooks/endpoint](https://www.npmjs.com/package/@rest-hooks/endpoint) as a peerDependency in the package.

<BeforeAfterTabs>

```typescript
import { Resource } from 'rest-hooks';

export default class UserResource extends Resource {
  /** Retrieves current logged in user */
  static currentShape<T extends typeof Resource>(this: T) {
    return {
      ...this.detailShape(),
      getFetchKey: () => {
        return '/current_user/';
      },
      fetch: (params: {}, body?: Readonly<object | string>) => {
        return this.fetch('post', `/current_user/`, body);
      },
    };
  }
}
```

<!--after-->

```typescript
import { Resource } from '@rest-hooks/rest';

export default class UserResource extends Resource {
  /** Retrieves current logged in user */
  static current<T extends typeof Resource>(this: T) {
    const endpoint = this.detail();
    return endpoint.extend({
      fetch() { return endpoint(this); }
      url() { return '/current_user/' },
    })
  }
}
```

</BeforeAfterTabs>

Currently all [Endpoints](/rest/api/Endpoint) also implement the `FetchShape` interface, so feel free to incrementally migrate. This means using Endpoint and extended via object spreads will still work:

```typescript
import { Resource } from 'rest-hooks';

export default class UserResource extends Resource {
  static currentShape<T extends typeof Resource>(this: T) {
    return {
      // this is an Endpoint, but can be spread the same way
      ...this.detail(),
      getFetchKey: () => {
        return '/current_user/';
      },
      fetch: (params: {}, body?: Readonly<object | string>) => {
        return this.fetch('post', `/current_user/`, body);
      },
    };
  }
}
```

Eventually support for FetchShape will be deprecated, and then removed.

#### Summary of interface differences

- schema is optional
- type removed in favor of sideEffect
  - type = 'read' -> sideEffect = undefined
  - type = 'mutate' -> sideEffect = true
- options members elevated to top
- top level object should be the actual fetch

</details>

[Full Release notes](https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%405.0.0)
