import { springEasing } from './spring';
import { springs } from './tokens';

/**
 * Global motion styles, injected into every page's <head> by the
 * `motion-css` plugin in docusaurus.config.ts:
 * - each spring as a CSS custom property (`transition: rotate var(--motion-snappy)`),
 *   and split into `-duration` and `-easing` for animations whose name is
 *   set elsewhere (view transitions); instant under reduced motion
 * - `<Reveal>`'s box, which its contents fill
 */
export function motionCss() {
  const tokens = Object.entries(springs);
  const vars = tokens.map(([name, spring]) => {
    const { duration, easing } = springEasing(spring);
    return `--motion-${name}: ${duration}ms ${easing}; --motion-${name}-duration: ${duration}ms; --motion-${name}-easing: ${easing};`;
  });
  const instant = tokens.map(
    ([name]) => `--motion-${name}: 0s; --motion-${name}-duration: 0s;`,
  );
  return [
    `:root { ${vars.join(' ')} }`,
    `@media (prefers-reduced-motion: reduce) { :root { ${instant.join(' ')} } }`,
    // view transitions animate only what opts in; the rest of the page
    // lands at once instead of cross-fading (which ghosts text that moves)
    ':root { view-transition-name: none; }',
    '.motion-reveal { display: flex; }',
    '.motion-reveal > * { flex: 1 1 auto; min-width: 0; }',
  ].join('\n');
}
