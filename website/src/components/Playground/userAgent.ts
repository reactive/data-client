/**
 * User-agent gates for the playground's heavy client code.
 *
 * - Bots/crawlers: never load Monaco or the live preview; the SSG markup
 *   (static code + empty preview frame) is what gets indexed.
 * - Mobile: no Monaco (poor touch UX and download cost); an editable
 *   react-live editor is used instead, but the live preview still runs.
 */
const BOT_UA = /bot|googlebot|crawler|spider|robot|crawling/i;
const MOBILE_UA = /Mobile|Android|BlackBerry/i;

function userAgent(): string {
  return typeof navigator === 'object' ? (navigator?.userAgent ?? '') : '';
}

/**
 * True for crawlers. Evaluated once at module load and false during SSR, so
 * only use it outside render (e.g. in a `lazy()` factory or an effect) to
 * avoid hydration mismatches.
 */
export const isBot = BOT_UA.test(userAgent());

/**
 * True for mobile browsers and crawlers. Returns false during SSR, so only
 * call it client-side after hydration (e.g. inside `<BrowserOnly>`).
 */
export function isMobileOrBot(): boolean {
  const ua = userAgent();
  return BOT_UA.test(ua) || MOBILE_UA.test(ua);
}
