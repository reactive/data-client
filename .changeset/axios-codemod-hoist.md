---
'@data-client/codemods': patch
---

Fix `axios-to-rest` building a new endpoint on every call and dropping axios types your code still uses

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

Axios types the file still names, like `AxiosRequestConfig` in a helper's signature, keep their import, so the file
still type checks. A `// TODO(data-client):` comment on the import marks them to replace before you uninstall axios.
