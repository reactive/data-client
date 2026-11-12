/**
 * Makes JSON text safe to inline inside a `<script>`.
 *
 * Without `<`, `>` or `&` the text cannot end the script or open a comment, and
 * U+2028 and U+2029 are escaped so it is also valid JavaScript. The result is
 * still valid JSON.
 */
export function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
