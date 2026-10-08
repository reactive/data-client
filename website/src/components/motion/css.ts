import { springEasing } from './spring';
import { springs } from './tokens';

/**
 * Global motion styles, injected into every page's <head> by the
 * `motion-css` plugin in docusaurus.config.ts:
 * - each spring as a CSS custom property (`transition: rotate var(--motion-snappy)`),
 *   and split into `-duration` and `-easing` for animations whose name is
 *   set elsewhere (view transitions); instant under reduced motion
 * - no view-transition name on the page root, so only `<ViewTransition>`s
 *   animate and the rest lands at once (a root cross-fade ghosts moved text)
 * - `<Reveal>`'s box, which its contents fill
 */
export function motionCss() {
  const tokens = Object.entries(springs);
  const vars = tokens.map(([name, spring]) => {
    const { duration, easing } = springEasing(spring);
    return `--motion-${name}-duration: ${duration}ms; --motion-${name}-easing: ${easing}; --motion-${name}: var(--motion-${name}-duration) var(--motion-${name}-easing);`;
  });
  const instant = tokens.map(([name]) => `--motion-${name}-duration: 0s;`);
  return [
    `:root { ${vars.join(' ')} }`,
    `@media (prefers-reduced-motion: reduce) { :root { ${instant.join(' ')} } }`,
    ':root { view-transition-name: none; }',
    '.motion-reveal { display: flex; }',
    '.motion-reveal > * { flex: 1 1 auto; min-width: 0; }',
  ].join('\n');
}
