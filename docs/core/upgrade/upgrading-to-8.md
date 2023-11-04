---
title: Upgrading from 7 to 8
---

import PkgInstall from '@site/src/components/PkgInstall';

For those who previously upgraded from 6 to 7, be sure to complete [preparing for the future](https://resthooks.io/docs/upgrade/upgrading-to-7#preparing-for-the-future). The future is now.

Upgrading can be done gradually as all changes were initially released in `/next`.

1. Upgrade to the latest v6:

  <PkgInstall pkgs="@rest-hooks/react@7.4.3" />

2. Incrementally move to new versions by importing from `/next`

   ```ts
   import { useController } from '@rest-hooks/react/next';
   ```

3. Upgrade to v8.

   <PkgInstall pkgs="@rest-hooks/react@8.2.2" />

4. Imports can be updated incrementally after upgrade. `/next` exports the same as top-level.

   ```ts
   import { useController } from '@rest-hooks/react';
   ```

### Changes

- **Controller.fetch()**: [2545](https://github.com/reactive/data-client/pull/2545) Controller.fetch() returns denormalized form when Endpoint has a Schema

  ```ts
  const handleChange = async e => {
    const todo = await ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: e.currentTarget.checked },
    );
    // todo is Todo, we can use all its members and be type-safe
    console.log(todo.pk(), todo.title);
  };
  ```

- **NetworkManager**: NetworkManager interface changed to only support new actions [2690](https://github.com/reactive/data-client/pull/2690)
- **SubscriptionManager/PollingSubscription** interfaces simplified based on new actions [2690](https://github.com/reactive/data-client/pull/2690)

### Removals of deprecated items

- [2691](https://github.com/reactive/data-client/pull/2691): Remove DispatchContext, DenormalizeCacheContext

### Deprecations

- controller.receive, controller.receiveError [2690](https://github.com/reactive/data-client/pull/2690)
- RECEIVE_TYPE [2690](https://github.com/reactive/data-client/pull/2690)
- MiddlewareAPI.controller (MiddlewareAPI is just controller itself) [2690](https://github.com/reactive/data-client/pull/2690)
  - `({controller}) => {}` -> `(controller) => {}`

[Github release link](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Freact%408.0.0)

## Rest @7

Upgrading can be done gradually as all changes were initially released in `/next`.

1. Upgrade to the latest v6:

  <PkgInstall pkgs="@rest-hooks/rest@6.7.2" />

2. Incrementally [move to new versions](https://github.com/reactive/data-client/pull/2606/files) by importing from `/next`

   ```ts
   import {
     RestEndpoint,
     createResource,
     GetEndpoint,
     MutateEndpoint,
   } from '@rest-hooks/rest/next';
   ```

   See the [migrations](https://github.com/reactive/data-client/pull/2606/files) of the /examples directory as an example

   If you have a base `RestEndpoint` and/or `createResource` function you can simply create two
   versions, which each extend from `@rest-hooks/rest` and `@rest-hooks/rest/next`

   <details><summary><b>Inheritance migration example</b></summary>

   ```ts title="EndpointBase.ts"
    import { RestEndpoint, RestGenerics  } from '@rest-hooks/rest';

    export default class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
      urlPrefix = 'https://api.github.com';

      getHeaders(headers: HeadersInit): HeadersInit {
        return {
          ...headers,
          'Access-Token': getAuth(),
        };
      }
    }
   ```
   ```ts title="NextEndpointBase.ts"
    import { RestEndpoint, RestGenerics } from '@rest-hooks/rest/next';

    export default class NextMyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
      urlPrefix = 'https://api.github.com';

      getHeaders(headers: HeadersInit): Promise<HeadersInit> {
        return {
          ...headers,
          'Access-Token': await getAuth(),
        };
      }
    }
   ```

   </details>

3. Upgrade to v7

   <PkgInstall pkgs="@rest-hooks/rest@7.4.0" />

4. Imports can be updated incrementally after upgrade. `/next` exports the same as top-level.

   ```ts
   import { RestEndpoint, createResource } from '@rest-hooks/rest';
   ```

### Changes

- RestEndpoint's getRequestInit and getHeaders optionally return a promise [2542](https://github.com/reactive/data-client/pull/2542)

  ```ts
  import { RestEndpoint } from '@rest-hooks/rest/next';

  export default class AuthdEndpoint<
    O extends RestGenerics = any,
  > extends RestEndpoint<O> {
    declare static accessToken?: string;

    async getHeaders(headers: HeadersInit) {
      return {
        ...headers,
        'Access-Token': await getOrFetchToken(),
      } as HeadersInit;
    }
  }

  export const TodoResource = createResource({
    urlPrefix: 'https://jsonplaceholder.typicode.com',
    path: '/todos/:id',
    schema: Todo,
    Endpoint: AuthdEndpoint,
  });
  ```

- createResource().getList uses a Collection, which .create appends to [2593](https://github.com/reactive/data-client/pull/2593)
  - `Resource.create` will automatically add to the list
    - `Resource.getList.push` is identical to `Resource.create`
  - **Remove** any [Endpoint.update](/rest/api/RestEndpoint#update) as it is not necessary and will not work
    ```ts
    const createUser = new RestEndpoint({
      path: '/user',
      method: 'POST',
      schema: User,
      // delete the following:
      // highlight-start
      update: (newUserId: string) => ({
        [userList.key()]: (users = []) => [newUserId, ...users],
      }),
      // highlight-end
    });
    ```
- `GetEndpoint` and `MutateEndpoint` parameters changed to what `NewGetEndpoint`, `NewMutateEndpoint` was.
- createResource() generics changed to `O extends ResourceGenerics` This allows customizing the Resource type with body and searchParams [2593](https://github.com/reactive/data-client/pull/2593)
  - `createGithubResource<U extends string, S extends Schema>` -> `createGithubResource<O extends ResourceGenerics>`

[Hoisting /next PR #2692](https://github.com/reactive/data-client/pull/2692)

### Removals of deprecated items

- [2690](https://github.com/reactive/data-client/pull/2690): Removed deprecated `Endpoint.optimisticUpdate` -> use `Endpoint.getOptimisticResponse`
- [2688](https://github.com/reactive/data-client/pull/2688) Remove `FetchShape` compatibility. This removes support for the legacy hooks in 'rest-hooks' like useResource()

[Github release link](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.0.0)

## Support

As usual, if you have any troubles or questions, feel free to join our [![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz) or [file a bug](https://github.com/reactive/data-client/issues/new/choose)
