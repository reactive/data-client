/** Shared user-agent patterns for bot/mobile detection. */
export const BOT_UA_REGEX = /bot|googlebot|crawler|spider|robot|crawling/i;
export const MOBILE_OR_BOT_UA_REGEX =
  /bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i;

/** True if crawler/bot (SSR-safe). Used for skipping Monaco/Preview load. */
export const isGoogleBot =
  typeof navigator === 'object' &&
  BOT_UA_REGEX.test(navigator?.userAgent ?? '');

/** Check if current browser is mobile or a bot - must be called client-side only */
export function isMobileOrBot(): boolean {
  return MOBILE_OR_BOT_UA_REGEX.test(navigator.userAgent);
}
