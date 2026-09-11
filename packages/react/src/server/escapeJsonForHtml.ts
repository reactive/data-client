const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Makes JSON text safe to inline inside an HTML `<script>`.
 *
 * `<` cannot end the script early, and the U+2028/2029 line terminators stay
 * valid inside a JavaScript string literal. The result is still valid JSON.
 */
export function escapeJsonForHtml(json: string): string {
  return json.replace(/[<>&\u2028\u2029]/g, char => ESCAPES[char]);
}
