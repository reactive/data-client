// React captures `isDevToolsPresent` when react-dom first loads (including
// `jest.mock('react-dom')` + `requireActual`). Install the hook here so concurrent
// suites can import reactCommitProbe in normal order and still record commits.
if (!globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    isDisabled: false,
    renderers: new Map(),
    inject: () => 1,
    onCommitFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onScheduleFiberRoot() {},
    checkDCE() {},
  };
}

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
