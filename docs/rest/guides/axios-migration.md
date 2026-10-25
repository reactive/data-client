---
title: Migrating from Axios to Reactive Data Client
sidebar_label: Axios Migration
---

import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import PkgTabs from '@site/src/components/PkgTabs';
import DiffEditor from '@site/src/components/DiffEditor';
import SetupTabs from '@site/src/components/SetupTabs';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrating from Axios

[`@data-client/rest`](/rest) replaces axios calls with typed endpoints whose responses go into one normalized cache.
A [codemod](#codemod) converts the calls; the [steps](#steps) below cover the rest.

<SiteOnly>

## Migrate with your coding agent {#agent}

<SetupTabs task="Migrate this app from axios to `@data-client/rest`" />

Your agent runs Data Client's setup [skill](/docs/getting-started/agent-skills), which follows this guide: it sets up
Data Client if the app doesn't have it yet, runs the codemod, then works through the [steps](#steps) the codemod can't
do. Review its diff like a teammate's.

</SiteOnly>

<AgentOnly>

To migrate an app from axios, install Data Client's setup skill from the project root:

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

Then read `.agents/skills/data-client-setup/SKILL.md` and follow it. It sets up Data Client if the app doesn't have
it, detects axios, and follows the steps below. If the app already uses Data Client, do the [steps](#steps) in order.

</AgentOnly>

## Why migrate?

<DiffEditor caption="Path parameters are typed from the `path` template, so a typo is a compile error instead of a wrong URL.">

```ts title="Before"
axios.get(`/users/${usrId}`);
```

```ts title="After"
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });
getUser({ id: '1' });
```

</DiffEditor>

- **Normalized cache**: each entity is stored once, so an update shows everywhere it's used, without refetching.
- **Declarative data**: components say what data they need with [`useSuspense()`](/docs/api/useSuspense), not how to
  fetch it, or track loading and error state.
- **Mutations update the UI**: responses update the cache, and [optimistic updates](./optimistic-updates.md) show the
  change before the server answers.
- **Less code**: [`resource()`](../api/resource.md) makes a full CRUD API from a `path` and a `schema`.

## Migrate step by step {#steps}

<SiteOnly>

These are the steps your agent follows. Commit before each one, so you can review its diff.

</SiteOnly>

### 1. Install {#install}

<PkgTabs pkgs="@data-client/rest" />

If the app doesn't use Data Client yet, also [install it and add its provider](/docs/getting-started/installation#manual-setup).

### 2. Run the codemod {#codemod}

A [jscodeshift](https://github.com/facebook/jscodeshift) codemod does the mechanical part. Commit first, then run it on
your source folders, never the repo root:

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

It:

- Replaces `import axios from 'axios'` with `import { RestEndpoint } from '@data-client/rest'`
- Converts `axios.create({ baseURL, headers })` into a base `RestEndpoint` subclass with `urlPrefix` and `getHeaders()`
- Transforms `axios.get()`, `.post()`, `.put()`, `.patch()` and `.delete()` into `new RestEndpoint({ path, method })`
- Transforms calls on a created instance (`api.post()` where `api = axios.create(...)`) into
  `new CreatedClassName({ path, method })`

If the project wraps axios in its own class or function and never calls `axios.get()` or `.post()` directly, or only
calls `axios(config)`, the codemod has little to do. Skip it and start at [step 3](#base-endpoint).

### 3. Move interceptors into a base endpoint {#base-endpoint}

Axios interceptors and instance config become methods on one `RestEndpoint` subclass that every endpoint extends. The
codemod creates this class from `axios.create()`; move the interceptors into it.

<DiffEditor caption="`RestEndpoint` parses JSON itself, so an interceptor that only unwraps `response.data` has nothing left to do.">

```ts title="Before"
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});

api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

api.interceptors.response.use(response => response.data);

export default api;
```

```ts title="After"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  // callout: Runs before every request, like a request interceptor. It can be `async`, to refresh a token first.
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
      Authorization: `Bearer ${getToken()}`,
    };
  }
}
```

</DiffEditor>

Response interceptors that change the body, such as converting `snake_case` keys, go in
[`process()`](../api/RestEndpoint.md#process); see [snakes to camels](./network-transform.md#snakes-to-camels).

#### Server error messages

Axios codebases often show the user `error.response.data.error` or `.message`. Read it from the `Response` body once,
in the base class's [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse), so call sites get it from
`error.message`:

```ts title="ApiEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    try {
      return await super.fetchResponse(input, init);
    } catch (error) {
      if (error instanceof NetworkError) {
        const body = await error.response
          .clone()
          .json()
          .catch(() => null);
        // keep the NetworkError so `status` and `errorPolicy()` still work
        error.message = body?.error ?? body?.message ?? error.message;
      }
      throw error;
    }
  }
}
```

#### Existing endpoint abstractions

A custom endpoint class that wraps axios (say, one with `path`, `method` and a `toDynamicUrl()` helper) can extend
`RestEndpoint` instead of being replaced. It keeps its backward-compatible methods and gains
[`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit),
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) and [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export class LegacyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = API_ROOT;
  declare queryKey?: string;

  /** @deprecated use url() */
  toDynamicUrl = this.url;
}

const getUser = new LegacyEndpoint({
  path: '/users/:id',
  queryKey: 'user',
  schema: User,
});
```

Pass extra members like `queryKey` as options rather than through a custom constructor, so
[`extend()`](../api/RestEndpoint.md#extend) (used by `resource()`, `hookifyResource()` and `useCancelling()`) keeps
working.

#### Context-based auth

When tokens come from :react[React context]:vue[`inject()`] (Okta, Auth0) rather than storage, `getHeaders()` can't
read them. Use [`hookifyResource()`](../api/hookifyResource.md) to add the headers through a
:react[hook]:vue[composable]. See the
[authentication guide](./auth.md) for this and other patterns.

### 4. Define entities and resources {#entities}

The codemod makes endpoints without a `schema`. An [Entity](../api/Entity.md) schema is what normalizes and caches the
responses, so define one for each type the API returns. Replace each module's CRUD functions on one path with a
[`resource()`](../api/resource.md):

<DiffEditor caption="One `resource()` replaces a module of CRUD functions, and `schema` puts every response in the normalized cache.">

```ts title="Before"
import api from './api';

export interface Post {
  id: string;
  title: string;
  body: string;
}

export const getPosts = () => api.get<Post[]>('/posts');
export const getPost = (id: string) => api.get<Post>(`/posts/${id}`);
export const createPost = (data: Omit<Post, 'id'>) =>
  api.post<Post>('/posts', data);
export const updatePost = (id: string, data: Partial<Post>) =>
  api.patch<Post>(`/posts/${id}`, data);
export const deletePost = (id: string) => api.delete(`/posts/${id}`);
```

```ts title="After"
import { Entity, resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';

export class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}

// callout: Gives `getList`, `get`, `getList.push`, `update`, `partialUpdate` and `delete`, all typed.
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

</DiffEditor>

Try the result against a mock API:

<EndpointPlayground input="https://api.example.com/posts/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'X-API-Key': 'my-key'}}} status={200} response={{ "id": "1", "title": "Hello World", "body": "First post" }}>

```ts title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}
```

```ts title="ApiEndpoint" collapsed
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
    };
  }
}
```

```ts title="PostResource"
import { resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import Post from './Post';

export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

```ts title="Usage" column
import { PostResource } from './PostResource';
PostResource.get({ id: '1' });
```

</EndpointPlayground>

Nested paths like `/projects/:projectId/tasks/:taskId` get their own resource. Keep standalone `new ApiEndpoint()` for
operations that aren't CRUD, like search, custom actions and auth.

:::warning

Don't define Entity classes and then leave `schema` unset on the endpoints: without `schema`, nothing is normalized,
and the migration gains little over axios.

:::

#### Non-standard primary keys

Many APIs (MongoDB, for example) use `_id` instead of `id`. Override [`pk()`](../api/Entity.md#pk):

```ts
import { Entity } from '@data-client/rest';

export class User extends Entity {
  _id = '';
  name = '';
  email = '';
  static key = 'User';

  pk() {
    return this._id;
  }
}
```

#### Body typing

Type the body of standalone `POST`, `PUT` and `PATCH` endpoints with `body: {} as BodyType`. Don't use
`undefined as unknown as BodyType`: `RestEndpoint` treats [`body`](../api/RestEndpoint.md#body)`: undefined` as having
no body argument. [`resource()`](../api/resource.md) types its endpoints' bodies itself.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

#### Coexisting with Zod or Yup

If the codebase already validates responses with Zod or Yup, choose one approach per type:

- **Zod in `process()`** (recommended): keep runtime validation by parsing in
  [`process()`](../api/RestEndpoint.md#process), and let the Entity handle normalization:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **Entity replaces Zod**: move the field shape into the Entity class and remove the Zod schema. Entity fields give
  types, not runtime checks, so add [`static validate()`](../api/Entity.md#validate) for any fields the server might
  send malformed.
- **Zod only, no Entity**: leave `schema` unset and parse manually. Only do this for endpoints that don't gain from
  normalization (auth tokens, one-off responses).

### 5. Convert call sites to hooks {#hooks}

Components stop storing responses in state. They read endpoints with [`useSuspense()`](/docs/api/useSuspense), and
mutate through the [Controller](/docs/api/Controller), which updates every component that shows the changed data.

:::react

<DiffEditor caption="Loading and error states move to an `AsyncBoundary` above the component.">

```tsx title="Before"
import { useEffect, useState } from 'react';
import { createPost, getPosts, type Post } from './api/posts';
import PostItems from './PostItems';
import Spinner from './Spinner';

function PostList() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => {
    getPosts().then(({ data }) => setPosts(data));
  }, []);
  const addPost = async (title: string) => {
    const { data } = await createPost({ title, body: '' });
    setPosts(posts => [...(posts ?? []), data]);
  };
  if (!posts) return <Spinner />;
  return <PostItems posts={posts} onAdd={addPost} />;
}
```

```tsx title="After"
import { useController, useSuspense } from '@data-client/react';
import { PostResource } from './api/posts';
import PostItems from './PostItems';

function PostList() {
  const posts = useSuspense(PostResource.getList);
  const ctrl = useController();
  // callout: Adds the new post to the cached list, so every component showing the list updates without a refetch.
  const addPost = (title: string) =>
    ctrl.fetch(PostResource.getList.push, { title, body: '' });
  return <PostItems posts={posts} onAdd={addPost} />;
}
```

</DiffEditor>

Put an [`AsyncBoundary`](/docs/api/AsyncBoundary) around the routes or panels that load data, to show their loading
and error states.

:::

:::vue

<DiffEditor caption="Loading and error states move to a `<Suspense>` above the component.">

```html title="Before"
<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { createPost, getPosts, type Post } from './api/posts';
  import PostItems from './PostItems.vue';

  const posts = ref<Post[]>();
  onMounted(async () => {
    posts.value = (await getPosts()).data;
  });
  async function addPost(title: string) {
    const { data } = await createPost({ title, body: '' });
    posts.value = [...(posts.value ?? []), data];
  }
</script>

<template>
  <Loading v-if="!posts" />
  <PostItems v-else :posts="posts" @add="addPost" />
</template>
```

```html title="After"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { PostResource } from './api/posts';
  import PostItems from './PostItems.vue';

  const posts = await useSuspense(PostResource.getList);
  const ctrl = useController();
  // callout: Adds the new post to the cached list, so every component showing the list updates without a refetch.
  const addPost = (title: string) =>
    ctrl.fetch(PostResource.getList.push, { title, body: '' });
</script>

<template>
  <PostItems :posts="posts" @add="addPost" />
</template>
```

</DiffEditor>

Put a [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html) around the routes or panels that load data, to
show their loading state, and handle their errors with
[`onErrorCaptured()`](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

:::react

#### Gradual migration

If the app uses TanStack Query or SWR and can't convert everything at once, keep those hooks for now but fetch through
[`controller.fetch()`](/docs/api/Controller#fetch). Calling an endpoint directly only runs its fetch; going through the
Controller also normalizes the response into the shared cache, so data is consistent from day one:

```ts
import { useController } from '@data-client/react';
import { useQuery } from '@tanstack/react-query';
import ApiEndpoint from './ApiEndpoint';
import { Project } from './Project';

export const getProject = new ApiEndpoint({
  path: '/projects/:id',
  schema: Project,
});

export function useProject(id: string) {
  const ctrl = useController();
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => ctrl.fetch(getProject, { id }),
  });
}
```

Later, replace `useProject(id)` with `useSuspense(getProject, { id })`.

:::

### 6. Migrate error handling {#error-handling}

<DiffEditor caption="`NetworkError` has the `status` and the raw `Response`, in place of axios's `error.response`.">

```ts title="Before"
import axios from 'axios';
import { getPost } from './api/posts';

try {
  const { data } = await getPost('1');
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
```

```ts title="After"
import { NetworkError } from '@data-client/rest';
import { PostResource } from './api/posts';

try {
  const post = await PostResource.get({ id: '1' });
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    console.log(err.response);
  }
}
```

</DiffEditor>

Components that read with `useSuspense()` get errors from :react[their `AsyncBoundary`]:vue[`onErrorCaptured()`]
instead of a `try`. For soft retries on
server errors, see [`errorPolicy`](../api/RestEndpoint.md#errorpolicy).

### 7. Remove axios {#remove-axios}

Search for what still uses axios:

| Pattern                                    | Finds                     |
| ------------------------------------------ | ------------------------- |
| `import.*from ['"]axios['"]`               | import statements         |
| `axios\.create`                            | instance creation         |
| `axios\.(get\|post\|put\|patch\|delete)`   | direct calls              |
| `\.interceptors\.(request\|response)\.use` | interceptors              |
| `isAxiosError`                             | error handling            |
| `cancelToken\|CancelToken`                 | cancellation (deprecated) |
| `onUploadProgress\|onDownloadProgress`     | progress callbacks        |

Migrate each match with the [reference](#quick-reference) below. When none are left, uninstall axios, then run the
type checker and tests:

```bash
npm uninstall axios
```

## Axios options reference {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                                   |
| `headers` config                         | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                               |
| `interceptors.request`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) / [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                 |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)                         |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                                       |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                                     |
| `isAxiosError` / `error.response`        | [`NetworkError`](#error-handling) with `.status` and `.response`                                                                  |
| `cancelToken` / `signal`                 | [`signal`](#cancellation)                                                                                                         |
| `timeout`                                | [`AbortSignal.timeout()`](#timeout) via `signal`                                                                                  |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](#binary-responses) / `'arrayBuffer'`                                                                          |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](#query-serialization)                                |
| `auth: { username, password }`           | [`getHeaders()` with `btoa()`](#basic-auth)                                                                                       |
| `validateStatus`                         | [Custom `fetchResponse()`](#accepting-error-statuses)                                                                             |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](#csrf-headers)                                                                                                   |
| `onUploadProgress`                       | [Custom `fetchResponse()` with XMLHttpRequest](#upload-progress)                                                                  |

### Cancellation

Both axios's `signal` and the deprecated `CancelToken` map to an
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) `signal`:

<DiffEditor>

```ts title="Before"
const source = axios.CancelToken.source();
axios.get('/users/1', { cancelToken: source.token });
source.cancel();
```

```ts title="After"
const controller = new AbortController();
const getUser = new RestEndpoint({
  path: '/users/:id',
  signal: controller.signal,
});
controller.abort();
```

</DiffEditor>

In components, [`useCancelling()`](/docs/api/useCancelling) cancels the in-flight request when its parameters change:

```tsx
import { useCancelling, useSuspense } from '@data-client/react';
import { searchEndpoint } from './api/search';
import ResultsList from './ResultsList';

function SearchResults({ query }: { query: string }) {
  const results = useSuspense(useCancelling(searchEndpoint), { q: query });
  return <ResultsList results={results} />;
}
```

See the [abort guide](./abort.md) for more patterns.

### Timeout

<DiffEditor>

```ts title="Before"
axios.get('/users', { timeout: 5000 });
```

```ts title="After"
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

</DiffEditor>

### Binary responses

<DiffEditor>

```ts title="Before"
axios.get('/files/1', { responseType: 'blob' });
```

```ts title="After"
const downloadFile = new RestEndpoint({
  path: '/files/:id',
  content: 'blob',
  // callout: Keeps large blobs out of the cache
  dataExpiryLength: 0,
});
```

</DiffEditor>

[`content`](../api/RestEndpoint.md#content) also takes `'arrayBuffer'` and `'text'`. See
[file download](./network-transform.md#file-download) to trigger a browser download.

### Query serialization

<DiffEditor>

```ts title="Before"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

```ts title="After"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams: Record<string, any>) {
    return qs.stringify(searchParams, { arrayFormat: 'repeat' });
  }
}
```

</DiffEditor>

See [`searchToString()`](../api/RestEndpoint.md#searchToString).

### Basic auth

<DiffEditor>

```ts title="Before"
axios.get('/api', { auth: { username: 'user', password: 'pass' } });
```

```ts title="After"
export default class BasicAuthEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Basic ${btoa('user:pass')}`,
    };
  }
}
```

</DiffEditor>

### Accepting error statuses

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) throws [`NetworkError`](#error-handling) for any status that
isn't `ok`. Override it to change what counts as an error:

<DiffEditor>

```ts title="Before"
axios.get('/api', { validateStatus: status => status < 500 });
```

```ts title="After"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class LenientEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    const response = await fetch(input, init);
    if (response.status >= 500) throw new NetworkError(response);
    return response;
  }
}
```

</DiffEditor>

### CSRF headers

```ts title="Before"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

Read the cookie in [`getHeaders()`](../api/RestEndpoint.md#getHeaders) for requests that aren't `GET`. See
[Django Integration](./django.md) for the complete endpoint class.

### Upload progress

`fetch` can't report upload progress, so use
[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) inside
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). The `onProgress` field is passed as an endpoint option, like
any other member.

```ts title="Before"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="UploadEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class UploadEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  declare onProgress?: (progress: number) => void;

  fetchResponse(input: RequestInfo, init: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      const abortError = () =>
        new DOMException('The operation was aborted.', 'AbortError');
      if (init.signal?.aborted) return reject(abortError());
      init.signal?.addEventListener('abort', abort, { once: true });

      xhr.open(
        init.method ?? 'POST',
        typeof input === 'string' ? input : input.url,
      );
      new Headers(init.headers).forEach((value, key) =>
        xhr.setRequestHeader(key, value),
      );
      xhr.onloadend = () =>
        init.signal?.removeEventListener('abort', abort);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) this.onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        const headers = new Headers();
        for (const line of xhr
          .getAllResponseHeaders()
          .trim()
          .split(/\r?\n/)) {
          const [key, ...rest] = line.split(': ');
          if (key) headers.append(key, rest.join(': '));
        }
        // 204, 205 and 304 responses can't have a body
        const body = [204, 205, 304].includes(xhr.status)
          ? null
          : xhr.response;
        const response = new Response(body, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        });
        if (response.ok) resolve(response);
        else reject(new NetworkError(response));
      };
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.onabort = () => reject(abortError());
      xhr.send(init.body as XMLHttpRequestBodyInit | null);
    });
  }
}

const uploadFile = new UploadEndpoint({
  path: '/upload',
  method: 'POST',
  body: {} as FormData,
  onProgress: (progress: number) => console.log(progress),
});
```

## Related guides

- [Authentication](./auth.md): token and cookie auth patterns
- [Aborting Fetch](./abort.md): cancellation and debouncing
- [Transforming data on fetch](./network-transform.md): response transforms, field renaming, file downloads
- [Django Integration](./django.md): CSRF and cookie auth for Django
