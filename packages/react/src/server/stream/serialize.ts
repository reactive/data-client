import { STREAM_GLOBAL } from './wire.js';
import type { StreamMessage } from './wire.js';

/**
 * JavaScript source for one inline script, or '' when there is nothing to send.
 * The host adds the `<script>` tag and the `nonce`.
 *
 * The messages travel as a JSON string for `JSON.parse`, not as an object
 * literal: in a literal, a `"__proto__"` key from API data would set its
 * object's prototype instead of being data. The string escapes `<`, so the
 * text cannot end the script or open a comment.
 */
export function serialize(messages: readonly StreamMessage[]): string {
  if (messages.length === 0) return '';
  const json = JSON.stringify(messages)
    .replace(/[\\']/g, '\\$&')
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `(self.${STREAM_GLOBAL}||(self.${STREAM_GLOBAL}=[])).push(...JSON.parse('${json}'));`;
}
