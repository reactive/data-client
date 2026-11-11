import { STREAM_GLOBAL } from './wire.js';
import type { StreamMessage } from './wire.js';

const UNSAFE = /[<\u2028\u2029]/g;
const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * JavaScript source for one inline script, or '' when there is nothing to send.
 * Escapes `<`, U+2028 and U+2029. The host adds the `<script>` tag and the `nonce`.
 */
export function serialize(messages: readonly StreamMessage[]): string {
  if (messages.length === 0) return '';
  const json = JSON.stringify(messages).replace(UNSAFE, c => ESCAPES[c]);
  return `(self.${STREAM_GLOBAL}||(self.${STREAM_GLOBAL}=[])).push(...${json});`;
}
