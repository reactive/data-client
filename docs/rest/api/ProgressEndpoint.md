---
title: ProgressEndpoint - Download progress tracking via ReadableStream
sidebar_label: ProgressEndpoint
description: RestEndpoint with download progress tracking via ReadableStream.
---

# ProgressEndpoint

`ProgressEndpoint` extends [RestEndpoint](./RestEndpoint.md) with download progress tracking
using the [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) API.

:::info extends

`ProgressEndpoint` extends [RestEndpoint](./RestEndpoint.md)

:::

## Usage

```ts
import { ProgressEndpoint, Entity, resource } from '@data-client/rest';

// Standalone endpoint with progress
const getFile = new ProgressEndpoint({
  path: '/files/:id',
  schema: FileEntity,
  onDownloadProgress({ loaded, total, lengthComputable }) {
    if (lengthComputable) {
      console.log(`${Math.round((loaded / total!) * 100)}%`);
    }
  },
});

// With resource()
const FileResource = resource({
  path: '/files/:id',
  schema: FileEntity,
  Endpoint: ProgressEndpoint,
});

// Add progress tracking to a specific endpoint via .extend()
const downloadWithProgress = FileResource.get.extend({
  onDownloadProgress({ loaded, total, lengthComputable }) {
    setProgress(lengthComputable ? loaded / total! : undefined);
  },
});
```

## onDownloadProgress {#onDownloadProgress}

Called once per chunk as the response body is read via `ReadableStream`.

```ts
onDownloadProgress?: (event: DownloadProgress) => void;
```

### DownloadProgress

```ts
interface DownloadProgress {
  /** Bytes downloaded so far */
  loaded: number;
  /** Total bytes (from Content-Length), or undefined if unknown */
  total: number | undefined;
  /** Whether total is known */
  lengthComputable: boolean;
}
```

`lengthComputable` is `false` when:
- The `Content-Length` header is missing (e.g., chunked transfer encoding)
- The `Content-Encoding` header is set (e.g., `gzip`), since `Content-Length` reflects the compressed size but chunks are decompressed

### Graceful degradation

When `response.body` is not available (e.g., older polyfills like `whatwg-fetch`),
progress tracking is silently skipped and the endpoint behaves identically to
[RestEndpoint](./RestEndpoint.md).

## How it works

`ProgressEndpoint` overrides [`fetchResponse()`](./RestEndpoint.md#fetchResponse) to intercept the response body stream:

1. Calls `super.fetchResponse()` to perform the HTTP request
2. If `onDownloadProgress` is set and `response.body` exists, reads the body chunk-by-chunk via `ReadableStream`
3. Calls `onDownloadProgress` after each chunk with cumulative `loaded` bytes
4. Reconstructs a `Response` from the collected chunks for [`parseResponse()`](./RestEndpoint.md#parseResponse) to consume

The rest of the lifecycle (`parseResponse`, `process`, schema normalization) is unchanged.

## Inheritance

`ProgressEndpoint` can be subclassed the same way as [RestEndpoint](./RestEndpoint.md#inheritance):

```ts
import { ProgressEndpoint, type RestGenerics } from '@data-client/rest';

class MyProgressEndpoint<
  O extends RestGenerics = any,
> extends ProgressEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }
}
```
