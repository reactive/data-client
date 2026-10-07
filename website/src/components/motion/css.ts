import { springEasing } from './spring';
import { springs } from './tokens';

/**
 * Global motion styles, injected into every page's <head> by the
 * `motion-css` plugin in docusaurus.config.ts:
 * - each spring as a CSS custom property (`transition: rotate var(--motion-snappy)`),
 *   instant under reduced motion
 * - `<Reveal>`'s box, which its contents fill
 */
export function motionCss() {
  const tokens = Object.entries(springs);
  const vars = tokens.map(([name, spring]) => {
    const { duration, easing } = springEasing(spring);
    return `--motion-${name}: ${duration}ms ${easing};`;
  });
  const instant = tokens.map(([name]) => `--motion-${name}: 0s;`);
  return [
    `:root { ${vars.join(' ')} }`,
    `@media (prefers-reduced-motion: reduce) { :root { ${instant.join(' ')} } }`,
    '.motion-reveal { display: flex; }',
    '.motion-reveal > * { flex: 1 1 auto; min-width: 0; }',
  ].join('\n');
}
