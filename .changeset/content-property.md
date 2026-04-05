---
'@data-client/rest': patch
---

Add `content` property to RestEndpoint for typed response parsing

Set `content` to control how the response body is parsed, with automatic return type inference:

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
});
const blob: Blob = await ctrl.fetch(downloadFile, { id: '123' });
```

Accepted values: `'json'`, `'blob'`, `'text'`, `'arrayBuffer'`, `'stream'`.

Non-JSON content types (`'blob'`, `'text'`, `'arrayBuffer'`, `'stream'`) constrain `schema` to
`undefined` at the type level, with a runtime check that throws if a normalizable schema is set.

When `content` is not set, auto-detection now handles binary Content-Types (`image/*`,
`application/octet-stream`, `application/pdf`, etc.) by returning `response.blob()` instead of
corrupting data via `.text()`.
