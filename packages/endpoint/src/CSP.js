/* istanbul ignore file */
const isBrowser = typeof document !== 'undefined';
export let CSP =
  isBrowser &&
  !document
    .querySelector("meta[http-equiv='Content-Security-Policy']")
    ?.getAttribute('content');
try {
  if (!CSP) Function();
} catch (e) {
  CSP = true;
  // TODO: figure out how to supress the error log instead of tell people it's okay
  if (isBrowser) {
    console.error(
      'Content Security Policy: The previous CSP log can be safely ignored - @data-client/endpoint will use setPrototypeOf instead',
    );
  }
}
