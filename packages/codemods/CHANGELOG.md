# @data-client/codemods

## 0.1.0

### Minor Changes

- [#4409](https://github.com/reactive/data-client/pull/4409) [`7d1c42a`](https://github.com/reactive/data-client/commit/7d1c42add1a00089a8ff604086cd0a2d295bbb45) - New package: run Data Client codemods with `npx @data-client/codemods <codemod> <path>`

  The codemods ship on npm with each release, instead of being fetched from dataclient.io at run time.

  ```bash
  npx @data-client/codemods v0.18 src/
  ```

### Patch Changes

- [#4464](https://github.com/reactive/data-client/pull/4464) [`4f1c324`](https://github.com/reactive/data-client/commit/4f1c324d42e8f8f55f8d0647ac4fe78c0328c77c) - `axios-to-rest` now turns axios calls into working endpoint calls

  It used to swap `api.get(url)` for `new ApiEndpoint({ path })` without calling it, so `await` returned the endpoint
  instead of data, and POST bodies and `params` were dropped. Now it calls the endpoint, passes path params, `params`,
  query strings and bodies as arguments, and reads the body where the code read `.data`:

  ```ts
  // before the codemod
  export async function getPost(id: string) {
    const res = await api.get<Post>(`/posts/${id}`, {
      params: { expand: 'author' },
    });
    return res.data;
  }
  ```

  ```ts
  // after the codemod
  const getPostEndpoint = new ApiEndpoint({
    path: '/posts/:id',
    searchParams: {} as Record<string, unknown>,
  });

  export async function getPost(id: string) {
    const res = await (getPostEndpoint({
      id,
      expand: 'author',
    }) as Promise<Post>);
    return res;
  }
  ```

  Calls through an `axios.create()` instance that another file exports, like `import { api } from './client'`, are
  converted too, and their import becomes the instance's new endpoint class.

  Anything it can't convert, such as interceptors, `timeout` or `isAxiosError()`, gets a `// TODO(data-client):` comment
  that links the [axios migration guide](https://dataclient.io/rest/guides/axios-migration) section covering it. Search
  for `TODO(data-client)` after running it.

- [#4592](https://github.com/reactive/data-client/pull/4592) [`8348b9d`](https://github.com/reactive/data-client/commit/8348b9de738770796ad34da542e71b3139b35fda) - Fix `axios-to-rest` building a new endpoint on every call and dropping axios types your code still uses

  An axios call inside a function now calls an endpoint the module defines once, named after the function, instead of
  building a new endpoint on every call. Add a `schema` to that `const` later, or pass it to `useSuspense()`:

  ```ts
  // before the codemod
  export async function getPost(id: string) {
    const res = await api.get<Post>(`/posts/${id}`);
    return res.data;
  }
  ```

  ```ts
  // after the codemod
  const getPostEndpoint = new ApiEndpoint({ path: '/posts/:id' });

  export async function getPost(id: string) {
    const res = await (getPostEndpoint({ id }) as Promise<Post>);
    return res;
  }
  ```

  When the client module imports the file back, the endpoint stays in the function, since the client's class isn't
  defined yet while that file loads.

  Axios names the file still uses, like `AxiosRequestConfig` in a helper's signature or `AxiosError` in a `catch`, keep
  their import, so the file still type checks. A `// TODO(data-client):` comment on the import marks them to replace
  before you uninstall axios.

- [#4610](https://github.com/reactive/data-client/pull/4610) [`b2c4c08`](https://github.com/reactive/data-client/commit/b2c4c082444034093d3e5531d357934f1d11429d) - Fix `axios-to-rest` leaving interceptors that read the removed axios instance

  Interceptors and `defaults` set up next to the instance used to stay as they were, reading an `api` that no longer
  exists. They are now commented out under a `TODO(data-client)` that says to move them into the endpoint class:

  ```ts
  // before the codemod
  export const api = axios.create({ baseURL: env.API_URL });
  api.interceptors.request.use(authRequestInterceptor);
  ```

  ```ts
  // after the codemod
  export class ApiEndpoint<
    O extends RestGenerics = any,
  > extends RestEndpoint<O> {
    urlPrefix = env.API_URL;
  }

  // TODO(data-client): `api` is the `ApiEndpoint` class now, so this interceptor is commented out; move it into `ApiEndpoint`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
  // api.interceptors.request.use(authRequestInterceptor);
  ```

- [#4602](https://github.com/reactive/data-client/pull/4602) [`42657ea`](https://github.com/reactive/data-client/commit/42657ea029f532d4a3c1f6794c23e33950b330df) - Convert `managers` arrays passed to [renderDataHook()](https://dataclient.io/docs/api/renderDataHook#optionsmanagers) in the `v0.19` codemod

  Before, `renderDataHook()` ignored `managers`; now the converted list runs instead of the defaults, so it must include a `NetworkManager` (`renderDataHook()` throws if it doesn't).

  ```ts
  renderDataHook(() => useThing(), {
    managers: [new NetworkManager(), logger],
  });
  // becomes
  renderDataHook(() => useThing(), {
    managers: () => [new NetworkManager(), logger],
  });
  ```
