---
title: Upgrading from 5 to 6
---
import BeforeAfterTabs from '@site/src/components/BeforeAfterTabs';

# Highlights

## Deprecated networking definitions were removed from `rest-hooks` exports, and moved to [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy).

FlatEntity, SimpleRecord, NestedEntity, schemas, isEntity, Entity, Resource, SimpleResource, SchemaDetail, SchemaList, Method

These are still supported! They are simply moved to [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy). This allows smooth incremental migrations.

1. `yarn add @rest-hooks/legacy@2.2.0`

- has all of these, and is compatible with both `rest-hooks` 5 and 6.

2. Upgrade `rest-hooks` & `@rest-hooks/legacy` to 6.
3. [Gradually migrate](https://resthooks.io/docs/upgrade/upgrading-to-5#rest-hooksrest) to [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

## @rest-hooks/endpoint changes

<details><summary>SimpleRecord -> [Object](https://resthooks.io/docs/api/Object)</summary>

SimpleRecord was removed (though available in [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy))

<BeforeAfterTabs>

```ts
export class Address extends SimpleRecord {
  readonly street: string = '';
  readonly suite: string = '';
  readonly city: string = '';
  readonly zipcode: string = '';
  readonly createdAt: Date = new Date(0);

  static schema = {
    createdAt: Date,
  };
}
```

<!--after-->

```ts
export const Address = {
  street: '',
  suite: '',
  city: '',
  zipcode: '',
  date: Date,
};
```

</BeforeAfterTabs>

</details>

## @rest-hooks/rest changes from 2 -> 3

These add on to the [existing changes](https://resthooks.io/docs/upgrade/upgrading-to-5#rest-hooksrest) of @rest-hooks/rest from @rest-hooks/legacy

- If `Resource.fromJS()` was used to customize normalization process, use `process()` instead.

  - ```ts
    class MyResource extends Resource {
      static process(input: any, parent: any, key: string | undefined): any {
        return {
          ...input,
          extraThing: 5,
        };
      }
    }
    ```

- New default [error behavior](#rest-hookscore)
  - To keep existing:
    ```ts
    class MyResource extends Resource {
      static getEndpointExtra(): EndpointExtraOptions | undefined {
        return {
          errorPolicy: error => 'soft' as const,
        };
      }
    }
    ```

# Full list of changes

## @rest-hooks/endpoint

### Entity

- fromJS() -> process() to customize init
- normalize results in POJO rather than instances
  - This is only meaningful for those inspecting the rest hooks state directly
- FlatEntity, SimpleRecord removed (use @rest-hooks/legacy)

## @rest-hooks/rest

- peerDep @rest-hooks/endpoint > 2

## @rest-hooks/core

- buildInferredResult -> inferResults
- Error behavior

  - useError() will no longer create synthetic errors for missing entities
  - <details><summary>useError() errorPolicy</summary>

    #### EndpointExtraOptions

    ```ts
    interface EndpointExtraOptions {
      //...rest
      errorPolicy?: (error: any) => 'soft' | undefined;
    }
    ```

    #### 'soft' vs `undefined`

    - 'soft' avoids errors if existing results are still available (even if stale)
    - `undefined` (hard error) means any error always falls

    #### @rest-hooks/rest

    New default policy: 5xx are soft, else hard.

    `@rest-hooks/rest` is where errors have 'status' members. This concept does not exist in base Endpoints.

    ```ts
      static getEndpointExtra(): EndpointExtraOptions | undefined {
        return;
        return {
          errorPolicy: error =>
            error.status >= 500 ? ('soft' as const) : undefined,
        };
      }
    ```

    #### PollingSubscription

    ```ts
              // never break when data already exists
              errorPolicy: () => 'soft' as const,
    ```

    #### @rest-hooks/legacy - Resource

    Existing policy was to always be 'soft' no matter what. This maintains that behavior.

    ```ts
      /** @deprecated */
      /** Get the request options for this SimpleResource  */
      static getFetchOptions(): FetchOptions | undefined {
        return {
          errorPolicy: () => 'soft' as const,
        };
      }
    ```

    https://github.com/coinbase/rest-hooks/pull/971

     </details>

  - polled fetch errors are always 'soft'
  - `@rest-hooks/rest`
    - 5xx: 'soft'
    - 4xx, 3xx, etc: 'hard'

- peerDep @rest-hooks/endpoint > 2

## rest-hooks

Removed exports from 'rest-hooks': NestedEntity, schemas, isEntity, Entity, Resource, SimpleResource, SchemaDetail, SchemaList, Method

- use @rest-hooks/legacy, or @rest-hooks/rest instead

## @rest-hooks/legacy

- peerDep @rest-hooks/endpoint > 2

[Full Release notes](https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%406.0.0)
