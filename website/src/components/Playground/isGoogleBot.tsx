export const isGoogleBot =
  typeof navigator === 'object' &&
  /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator?.userAgent);
