const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Makes JSON text safe to inline inside a `<script>`.
 *
 * `<` cannot end the script early, and the result is still valid JSON.
 */
export function escapeJsonForScript(json: string): string {
  return json.replace(/[<>&\u2028\u2029]/g, char => ESCAPES[char]);
}
