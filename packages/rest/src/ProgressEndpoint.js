import RestEndpoint from './RestEndpoint.js';

/** RestEndpoint with download progress tracking via ReadableStream.
 *
 * @see https://dataclient.io/rest/api/ProgressEndpoint
 */
export default class ProgressEndpoint extends RestEndpoint {
  async fetchResponse(input, init) {
    const response = await super.fetchResponse(input, init);
    if (this.onDownloadProgress && response.body && !response.bodyUsed) {
      try {
        return await readWithProgress(response, this.onDownloadProgress);
      } catch (error) {
        if (error instanceof TypeError) {
          error.status = 500;
        }
        throw error;
      }
    }
    return response;
  }
}

async function readWithProgress(response, onProgress) {
  const contentEncoding = response.headers.get('content-encoding');
  const contentLength = response.headers.get('content-length');
  const total =
    !contentEncoding && contentLength ? parseInt(contentLength, 10) : undefined;

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress({ loaded, total, lengthComputable: total !== undefined });
    }
  } finally {
    reader.releaseLock();
  }

  const reconstructed = new Response(new Blob(chunks), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  Object.defineProperty(reconstructed, 'url', { value: response.url });
  return reconstructed;
}
