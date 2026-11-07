---
'@data-client/codemods': patch
---

Fix `axios-to-rest` leaving interceptors that read the removed axios instance

Interceptors and `defaults` set up next to the instance used to stay as they were, reading an `api` that no longer
exists. They are now commented out under a `TODO(data-client)` that says to move them into the endpoint class:

```ts
// before the codemod
export const api = axios.create({ baseURL: env.API_URL });
api.interceptors.request.use(authRequestInterceptor);
```

```ts
// after the codemod
export class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = env.API_URL;
}

// TODO(data-client): `api` is the `ApiEndpoint` class now, so this interceptor is commented out; move it into `ApiEndpoint`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.interceptors.request.use(authRequestInterceptor);
```
