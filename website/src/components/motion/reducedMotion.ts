// same as @docusaurus/theme-common's, but safe without matchMedia (jsdom)
export function prefersReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
