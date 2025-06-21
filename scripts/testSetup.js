require('whatwg-fetch');
require('core-js/stable');
window.requestIdleCallback = jest.fn().mockImplementation(cb => {
  cb();
});
if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = require('node:util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.ReadableStream || !globalThis.WritableStream) {
  const { ReadableStream, WritableStream } = require('node:stream/web');
  globalThis.ReadableStream = ReadableStream;
  globalThis.WritableStream = WritableStream;
}

if (!globalThis.TextEncoderStream) {
  const { TextEncoderStream } = require('node:stream/web');
  globalThis.TextEncoderStream = TextEncoderStream;
}

if (!globalThis.TransformStream) {
  const { TransformStream } = require('node:stream/web');
  globalThis.TransformStream = TransformStream;
}
