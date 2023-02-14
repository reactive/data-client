/* istanbul ignore file */
export let CSP = false;
try {
  Function();
} catch (e) {
  CSP = true;
  // TODO: figure out how to supress the error log instead of tell people it's okay
  console.error(
    'Content Security Policy: The previous CSP log can be safely ignored - @rest-hooks/endpoint will use setPrototypeOf instead',
  );
}
