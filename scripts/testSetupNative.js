import('node-fetch').then(({ default: fetch }) => {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  globalThis.fetch = fetch;
});
