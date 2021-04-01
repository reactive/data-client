export class NotImplementedError extends Error {
  /* istanbul ignore next */
  message =
    process.env.NODE_ENV === 'production'
      ? 'Not Implemented'
      : 'Not Implemented. You must provide an override for this method.';
}
