---
title: Controller
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args) => ReturnType<E>;
  invalidate(endpoint, ...args) => Promise<void>;
  resetEntireStore: () => Promise<void>;
  receive(endpoint, ...args, response) => Promise<void>;
  receiveError(endpoint, ...args, error) => Promise<void>;
  subscribe(endpoint, ...args) => Promise<void>;
  unsubscribe(endpoint, ...args) => Promise<void>;
}
```

[useController()](./useController.md) provides access in React components

## fetch(endpoint, ...args) {#fetch}

Fetches the endpoint with given args, updating the Rest Hooks cache with
the response or error upon completion.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```tsx
function CreatePost() {
  const { fetch } = useController();

  return (
    <form
      onSubmit={e => fetch(PostResource.create(), {}, new FormData(e.target))}
    >
      {/* ... */}
    </form>
  );
}
```

</TabItem>
<TabItem value="Update">

```tsx
function UpdatePost({ id }: { id: string }) {
  const { fetch } = useController();

  return (
    <form
      onSubmit={e =>
        fetch(PostResource.update(), { id }, new FormData(e.target))
      }
    >
      {/* ... */}
    </form>
  );
}
```

</TabItem>
<TabItem value="Delete">

```tsx
function PostListItem({ post }: { post: PostResource }) {
  const { fetch } = useController();

  const handleDelete = useCallback(
    async e => {
      await fetch(PostResource.delete(), { id: post.id });
      history.push('/');
    },
    [fetch, id],
  );

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={handleDelete}>X</button>
    </div>
  );
}
```

</TabItem>
</Tabs>

### Endpoint.sideEffect

[sideEffect](./Endpoint.md#sideeffect) changes the behavior

#### true

- Resolves _before_ committing Rest Hooks cache updates.
- Each call will always cause a new fetch.

#### undefined

- Resolves _after_ committing Rest Hooks cache updates.
- Identical requests are deduplicated globally; allowing only one inflight request at a time.
  - To ensure a _new_ request is started, make sure to abort any existing inflight requests.

## invalidate(endpoint, ...args) {#invalidate}

Forces refetching and suspense on [useResource](./useResource.md) with the same Endpoint
and parameters.

```tsx
function ArticleName({ id }: { id: string }) {
  const article = useResource(ArticleResource.detail(), { id });
  const { invalidate } = useController();

  return (
    <div>
      <h1>{article.title}<h1>
      <button onClick={() => invalidate(ArticleResource.detail(), { id })}>Fetch &amp; suspend</button>
    </div>
  );
}
```

:::tip

To refresh while continuing to display stale data - [Controller.fetch](#fetch) instead.

:::

:::tip Invalidate many endpoints at once

Use [schema.Delete](./Delete.md) to invalidate every endpoint that contains a given entity.

:::

## resetEntireStore() {#resetEntireStore}

Resets the entire Rest Hooks cache. All inflight requests will not resolve.

This is typically used when logging out or changing authenticated users.

```tsx
const USER_NUMBER_ONE: string = "1111";

function UserName() {
  const user = useResource(CurrentUserResource.detail(), { });
  const { resetEntireStore } = useController();

  const becomeAdmin = useCallback(() => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // highlight-next-line
    resetEntireStore();
  }, []);
  return (
    <div>
      <h1>{user.name}<h1>
      <button onClick={becomeAdmin}>Be Number One</button>
    </div>
  );
}
```

## receive(endpoint, ...args, response) {#receive}

Stores `response` in cache for given [Endpoint](./Endpoint.md) and args.

Any components suspending for the given [Endpoint](./Endpoint.md) and args will resolve.

If data already exists for the given [Endpoint](./Endpoint.md) and args, it will be updated.

```tsx
const { receive } = useController();

useEffect(() => {
  const websocket = new Websocket(url);

  websocket.onmessage = event =>
    receive(EndpointLookup[event.endpoint], ...event.args, event.data);

  return () => websocket.close();
});
```

## receiveError(endpoint, ...args, error) {#receiveError}

Stores the result of [Endpoint](./Endpoint.md) and args as the error provided.

## subscribe(endpoint, ...args) {#subscribe}

Marks a new subscription to a given [Endpoint](./Endpoint.md). This should increment the subscription.

[useSubscription](./useSubscription.md) calls this on mount.

This might be useful for custom hooks to sub/unsub based on other factors.

```tsx
const controller = useController();
const key = endpoint.key(...args);

useEffect(() => {
  controller.subscribe(endpoint, ...args);
  return () => controller.unsubscribe(endpoint, ...args);
}, [controller, key]);
```

## unsubscribe(endpoint, ...args) {#unsubscribe}

Marks completion of subscription to a given [Endpoint](./Endpoint.md). This should
decrement the subscription and if the count reaches 0, more updates won't be received automatically.

[useSubscription](./useSubscription.md) calls this on unmount.

## getResponse(endpoint, ...args, state) {#getResponse}

Gets the (globally referentially stable) response for a given endpoint/args pair from state given.

This is used in [useCache](./useCache.md), [useResource](./useResource.md) and can be used in
[Managers](./Manager.md) to lookup a response with the state provided.

```tsx title="useCache.ts"
import {
  useController,
  StateContext,
  EndpointInterface,
} from '@rest-hooks/core';

/** Oversimplified useCache */
function useCache<E extends EntityInterface>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
) {
  const state = useContext(StateContext);
  const controller = useController();
  return controller.getResponse(endpoint, ...args, state);
}
```

```tsx title="MyManager.ts"
import type { Manager, Middleware, actionTypes } from '@rest-hooks/core';
import type { EndpointInterface } from '@rest-hooks/endpoint';

export default class MyManager implements Manager {
  protected declare middleware: Middleware;
  constructor() {
    this.middleware = ({ controller, getState }) => {
      return next => async action => {
        if (action.type === actionTypes.FETCH_TYPE) {
          console.log('The existing response of the requested fetch');
          console.log(
            controller.getResponse(
              action.endpoint,
              ...(action.meta.args as Parameters<typeof action.endpoint>),
              getState(),
            ),
          );
        }
        next(action);
      };
    };
  }

  cleanup() {
    this.websocket.close();
  }

  getMiddleware<T extends StreamManager>(this: T) {
    return this.middleware;
  }
}
```

## getError(endpoint, ...args, state) {#getError}

Gets the error, if any, for a given endpoint. Returns undefined for no errors.
