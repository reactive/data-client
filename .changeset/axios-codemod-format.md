---
'@data-client/codemods': patch
---

Fix `axios-to-rest` output that Prettier rejects or that reads the removed axios instance

The code it writes now uses the quotes and trailing commas the file already uses, and passes path params on one line
when a body follows them, so a Prettier-formatted project stays formatted.

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
