/** Check if current browser is mobile or a bot - must be called client-side only */
export function isMobileOrBot(): boolean {
  return /bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(
    navigator.userAgent,
  );
}
