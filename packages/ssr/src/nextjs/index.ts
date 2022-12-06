Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
export { default as RestHooksDocument } from './RestHooksDocument.js';
export { default as AppCacheProvider } from './AppCacheProvider.js';
