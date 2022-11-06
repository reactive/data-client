---
title: Rest Authentication
sidebar_label: Authentication
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

All network requests are run through the [getRequestInit](../api/RestEndpoint.md#getRequestInit) optionally
defined in your [RestEndpoint](../api/RestEndpoint.md).

## Cookie Auth

Here's an example using simple cookie auth:

```ts title="api/AuthdEndpoint.ts"
import { RestEndpoint } from '@rest-hooks/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body: any): RequestInit {
    return {
      ...super.getRequestInit(body),
      // highlight-next-line
      credentials: 'same-origin',
    };
  }
}
```

```ts title="api/MyResource.ts"
import { createResource, Entity } from '@rest-hooks/rest';
import AuthdEndpoint from 'api/AuthdEndpoint';

class MyEntity extends Entity {
  /* Define MyEntity */
}

export const MyResource = createResource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

## Access Tokens or JWT

<Tabs
defaultValue="static"
values={[
{ label: 'static member', value: 'static' },
{ label: 'function singleton', value: 'function' },
]}>
<TabItem value="static">

```ts title="api/AuthdEndpoint.ts"
import { RestEndpoint } from '@rest-hooks/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // highlight-next-line
  declare static accessToken?: string;

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      // highlight-next-line
      'Access-Token': this.constructor.accessToken,
    };
  }
}
```

Upon login we set the token:

```tsx title="Auth.tsx"
import AuthdEndpoint from 'api/AuthdEndpoint';

function Auth() {
  const handleLogin = useCallback(
    async e => {
      const { accessToken } = await login(new FormData(e.target));
      // success!
      // highlight-next-line
      AuthdResource.accessToken = accessToken;
    },
    [login],
  );

  return <AuthForm onSubmit={handleLogin} />;
}
```

</TabItem>
<TabItem value="function">

```ts title="api/AuthdEndpoint.ts"
import { getAuthToken } from 'authorization-singleton';
import { RestEndpoint } from '@rest-hooks/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      // highlight-next-line
      'Access-Token': getAuthToken(),
    };
  }
}
```

Upon login we set the token:

```tsx title="Auth.tsx"
import { setAuthToken } from 'authorization-singleton';
import AuthdResource from 'resources/AuthdResource';

function Auth() {
  const handleLogin = useCallback(
    async e => {
      const { accessToken } = await login(new FormData(e.target));
      // success!
      // highlight-next-line
      setAuthToken(accessToken);
    },
    [login],
  );

  return <AuthForm onSubmit={handleLogin} />;
}
```

</TabItem>
</Tabs>

```ts title="api/MyResource.ts"
import { createResource, Entity } from '@rest-hooks/rest';
import AuthdEndpoint from 'api/AuthdEndpoint';

class MyEntity extends Entity {
  /* Define MyEntity */
}

export const MyResource = createResource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

## Auth Headers from React Context

:::warning

Using React Context for state that is not displayed (like auth tokens) is not recommended.
This will result in unnecessary re-renders and application complexity.

:::

<Tabs
defaultValue="resource"
values={[
{ label: 'Resource', value: 'resource' },
{ label: 'RestEndpoint', value: 'endpoint' },
]}>
<TabItem value="resource">

We can transform any [Resource](../api/createResource.md) into one that uses hooks to create endpoints
by using [hookifyResource](../api/hookifyResource.md)

```ts title="api/Post.ts"
import { createResource, hookifyResource } from '@rest-hooks/rest';

// Post defined here

export const PostResource = hookifyResource(
  createResource({ path: '/posts/:id', schema: Post }),
  function useInit(): RequestInit {
    const accessToken = useAuthContext();
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

Then we can get the endpoints as hooks in our React Components

```tsx
import { useSuspense } from 'rest-hooks';
import { PostResource } from 'api/Post';

function PostDetail({ id }) {
  const post = useSuspense(PostResource.useGet(), { id });
  return <div>{post.title}</div>;
}
```

:::caution

Using this means all endpoint calls must only occur during a function render.

```tsx
function CreatePost() {
  const controller = useController();
  //highlight-next-line
  const createPost = PostResource.useCreate();

  return (
    <form onSubmit={e => controller.fetch(createPost, new FormData(e.target))}>
      {/* ... */}
    </form>
  );
}
```

:::

</TabItem>
<TabItem value="endpoint">

We will first provide an easy way of using the context to alter the fetch headers.

```ts title="api/AuthdEndpoint.ts"
import { RestEndpoint } from '@rest-hooks/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // highlight-next-line
  declare accessToken?: string;

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      // highlight-next-line
      'Access-Token': this.accessToken,
    };
  }
}
```

Next we will [extend](../api/RestEndpoint.md#extend) to generate a new endpoint with this context injected.

```tsx
function useEndpoint(endpoint: RestEndpoint) {
  const accessToken = useAuthContext();
  return useMemo(
    () => endpoint.extend({ accessToken }),
    [endpoint, accessToken],
  );
}
```

:::caution

Using this means all endpoint calls must only occur during a function render.

```tsx
function CreatePost() {
  const controller = useController();
  //highlight-next-line
  const createPost = useEndpoint(PostResource.create);

  return (
    <form
      onSubmit={e => controller.fetch(createPost, {}, new FormData(e.target))}
    >
      {/* ... */}
    </form>
  );
}
```

:::

</TabItem>
</Tabs>

## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
