---
'@data-client/rest': minor
---

Add `ProgressEndpoint` for download progress tracking via ReadableStream

`ProgressEndpoint` extends `RestEndpoint` with an `onDownloadProgress` callback that reports `{ loaded, total, lengthComputable }` as the response body streams in. Use it standalone, with `resource()`, or per-endpoint via `.extend()`.

```ts
import { ProgressEndpoint, resource } from '@data-client/rest';

const FileResource = resource({
  path: '/files/:id',
  schema: FileEntity,
  Endpoint: ProgressEndpoint,
});

const downloadWithProgress = FileResource.get.extend({
  onDownloadProgress({ loaded, total, lengthComputable }) {
    setProgress(lengthComputable ? loaded / total! : undefined);
  },
});
```

Gracefully degrades to standard `RestEndpoint` behavior when `response.body` is unavailable (e.g., older polyfills).

New exports:
- `ProgressEndpoint`
- `DownloadProgress` (type)
