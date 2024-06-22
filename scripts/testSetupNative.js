import('node-fetch').then(({ default: fetch }) => {
  // eslint-disable-next-line no-undef
  globalThis.fetch = fetch;
});
