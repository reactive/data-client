/** Layouts in design-system.css that use more width than a docs row's
 * preview has beside the code (`.split`: a list beside what it opens). A
 * demo whose code uses one gets a preview that reaches into the TOC column
 * (css/customTheme.css); add a new such layout here. Not in the demo scope */
const ROOMY_LAYOUT = /className=["'][^"']*\bsplit\b/;

export function asksForRoom(code: string) {
  return ROOMY_LAYOUT.test(code);
}
