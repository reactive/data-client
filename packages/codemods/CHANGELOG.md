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
  const res = await api.get<Post>(`/posts/${id}`, {
    params: { expand: 'author' },
  });
  return res.data;
  ```

  ```ts
  // after the codemod
  const res = await (new ApiEndpoint({
    path: '/posts/:id',
    searchParams: {} as Record<string, unknown>,
  })({ id, expand: 'author' }) as Promise<Post>);
  return res;
  ```

  Calls through an `axios.create()` instance that another file exports, like `import { api } from './client'`, are
  converted too, and their import becomes the instance's new endpoint class.

  Anything it can't convert, such as interceptors, `timeout` or `isAxiosError()`, gets a `// TODO(data-client):` comment
  that links the [axios migration guide](https://dataclient.io/rest/guides/axios-migration) section covering it. Search
  for `TODO(data-client)` after running it.
