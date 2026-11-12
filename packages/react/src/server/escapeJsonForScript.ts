/**
 * Makes JSON text safe to inline inside a `<script>`.
 *
 * `<` cannot end the script early, and the result is still valid JSON.
 */
export function escapeJsonForScript(json: string): string {
  return json.replace(
    /[<>&\u2028\u2029]/g,
    char => '\\u' + ('000' + char.charCodeAt(0).toString(16)).slice(-4),
  );
}
