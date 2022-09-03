---
title: Resource Authentication
sidebar_label: Authentication
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

All network requests are run through the `static getFetchInit` optionally
defined in your `Resource`.

## Cookie Auth

Here's an example using simple cookie auth:

<Tabs
defaultValue="fetch"
values={[
{ label: 'fetch', value: 'fetch' },
{ label: 'superagent', value: 'superagent' },
]}>
<TabItem value="fetch">

```typescript
import { Resource } from '@rest-hooks/rest';

abstract class AuthdResource extends Resource {
  static getFetchInit = (init: RequestInit): RequestInit => ({
    ...init,
    credentials: 'same-origin',
  });
}
```

</TabItem>
<TabItem value="superagent">

```typescript
import { Resource } from '@rest-hooks/rest';
import type { SuperAgentRequest } from 'superagent';

abstract class AuthdResource extends Resource {
  static fetchPlugin = (request: SuperAgentRequest) =>
    request.withCredentials();
}
```

If you used the [custom superagent fetch](../guides/custom-networking#superagent)

</TabItem>
</Tabs>

You can also do more complex flows (like adding arbitrary headers) to
the request. Every [getFetchInit()](api/Resource.md#getFetchInit) takes in the existing [init options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) of fetch, and returns new init options to be used.

## Access Tokens

<Tabs
defaultValue="static"
values={[
{ label: 'static member', value: 'static' },
{ label: 'function singleton', value: 'function' },
]}>
<TabItem value="static">

```ts title="resources/AuthdResource.ts"
import { getAuthToken } from 'authorization-singleton';
import { Resource } from '@rest-hooks/rest';

abstract class AuthdResource extends Resource {
  // highlight-next-line
  declare static accessToken?: string;
  static getFetchInit = (init: RequestInit): RequestInit => ({
    ...init,
    headers: {
      ...init.headers,
      // highlight-next-line
      'Access-Token': this.accessToken,
    },
  });
}
```

Upon login we set the token:

```tsx title="Auth.tsx"
import AuthdResource from 'resources/AuthdResource';

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

```ts
import { getAuthToken } from 'authorization-singleton';
import { Resource } from '@rest-hooks/rest';

abstract class AuthdResource extends Resource {
  static getFetchInit = (init: RequestInit): RequestInit => ({
    ...init,
    headers: {
      ...init.headers,
      // highlight-next-line
      'Access-Token': getAuthToken(),
    },
  });
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

## Auth Headers from React Context

:::warning

Using React Context for state that is not displayed (like auth tokens) is not recommended.

:::

Here we use a context variable to set headers. Note - this means any endpoint functions can only be
called from a React Component. (However, this should be fine since the context will only exist in React anyway.)

[HookableResource](api/HookableResource.md) gives us endpoint methods that are hooks so we can access
React context.

```typescript
import { HookableResource } from '@rest-hooks/rest';

abstract class AuthdResource extends HookableResource {
  static useFetchInit = (init: RequestInit) => {
    const accessToken = useAuthContext();
    return {
      ...init,
      headers: {
        ...init.headers,
        'Access-Token': accessToken,
      },
    };
  };
}
```

:::caution

Using this means all endpoint calls must only occur during a function render.

```tsx
function CreatePost() {
  const { fetch } = useController();
  // PostResource.useCreate() calls useFetchInit()
  //highlight-next-line
  const createPost = PostResource.useCreate();

  return (
    <form
      onSubmit={e => fetch(createPost, {}, new FormData(e.target))}
    >
      {/* ... */}
    </form>
  );
}
```

:::


## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
