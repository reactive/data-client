---
title: Upgrading from 5 to 6
---
import BeforeAfterTabs from '@site/src/components/BeforeAfterTabs';
import PkgTabs from '@site/src/components/PkgTabs';

<PkgTabs pkgs="rest-hooks@6 @rest-hooks/rest@3" upgrade />

## Highlights

### Package compatibility

Be sure to upgrade these packages prior to upgrading Rest Hooks itself. They maintain compatibility
with rest hooks 5.

- [@rest-hooks/test](https://www.npmjs.com/package/@rest-hooks/test) >= 6.2
- [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy) >= 2.3.0
- [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks) >= 1.4
- [@rest-hooks/img](https://www.npmjs.com/package/@rest-hooks/img) >= 0.4.0

Upgrade at the same time:

[@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest) 3.0 drops compatibility with
older versions, so this will have to be upgraded in unison. All breaking changes [are listed below](#rest-hooksrest-changes-from-2---3)

:::caution

Due to a bug in npm 7, it might install multiple peerDeps (@rest-hooks/normalizr). If
this happens, you can fix by completely uninstalling rest hooks packages and then reininstalling:

```bash
npm uninstall rest-hooks @rest-hooks/rest
npm install --save rest-hooks@6 @rest-hooks/rest@3
```

:::

### Exports moved to [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy).

FlatEntity, SimpleRecord, NestedEntity, schemas, isEntity, Entity, Resource, SimpleResource, SchemaDetail, SchemaList, Method

These are still supported! They are simply moved to [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy). This allows smooth incremental migrations.

1. `yarn add @rest-hooks/legacy@2.2.0`

    has all of these, and is compatible with both `rest-hooks` 5 and 6.
2. Upgrade `rest-hooks` to 6 & `@rest-hooks/legacy` to 3.
3. [Gradually migrate](https://resthooks.io/docs/upgrade/upgrading-to-5#rest-hooksrest) to [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

### Importing directly from hidden files is no longer supported

All packages now use [package exports](https://webpack.js.org/guides/package-exports/), which if
supported disallow importing directly from any sub path like `rest-hooks/lib/react-integration/hooks/useSuspense`

Doing this was never supported as file locations would change without announcement. However, now
with tooling that supports package exports, it will not work at all.

### Store state internals

Entities no longer normalize to their class. Class construction is now done during denormalization step.
This means the internal state of Rest Hooks is a [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object). This
improves serialization. However, it does mean relying on the internal state in a [Manager](https://resthooks.io/docs/api/Manager)
to be a class will break. Additionally the expected serialization of Rest Hooks store will be slightly different, which
could affect snapshot tests or persistance efforts like using IndexedDB.

### @rest-hooks/endpoint changes

<details><summary>SimpleRecord -> Object</summary>

SimpleRecord was removed (though available in [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy))

[Object](https://resthooks.io/docs/api/Object) can be used instead

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

### @rest-hooks/rest changes from 2 -> 3

These add on to the [existing changes](https://resthooks.io/docs/upgrade/upgrading-to-5#rest-hooksrest) of @rest-hooks/rest from @rest-hooks/legacy

- If `Resource.fromJS()` was used to customize normalization process, use `process()` instead.

   ```ts
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
    ```ts title="To keep existing"
    class MyResource extends Resource {
      static getEndpointExtra(): EndpointExtraOptions | undefined {
        return {
          errorPolicy: error => 'soft' as const,
        };
      }
    }
    ```

## Full list of changes

### Node >=12

Node 12 is now the minimum version required. This only applies if Rest Hooks
is actually used within node. (SSR or testing are likely cases.)

### @rest-hooks/endpoint

#### Entity

- fromJS() -> process() to customize init
- normalize results in POJO rather than instances
  - This is only meaningful for those inspecting the rest hooks state directly
- FlatEntity, SimpleRecord removed (use @rest-hooks/legacy)

### @rest-hooks/rest

- peerDep @rest-hooks/endpoint > 2

### @rest-hooks/core

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

### rest-hooks

Removed exports from 'rest-hooks': NestedEntity, schemas, isEntity, Entity, Resource, SimpleResource, SchemaDetail, SchemaList, Method

- use @rest-hooks/legacy, or @rest-hooks/rest instead

### @rest-hooks/legacy

- peerDep @rest-hooks/endpoint > 2

[Full Release notes](https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%406.0.0)
