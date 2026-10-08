import { motionCss } from '../css';
import { springEasing } from '../spring';
import { springs } from '../tokens';

it('declares every spring, instant under reduced motion', () => {
  const css = motionCss();
  for (const [name, spring] of Object.entries(springs)) {
    const { duration, easing } = springEasing(spring);
    expect(css).toContain(`--motion-${name}-duration: ${duration}ms;`);
    expect(css).toContain(`--motion-${name}-easing: ${easing};`);
    expect(css).toContain(
      `--motion-${name}: var(--motion-${name}-duration) var(--motion-${name}-easing);`,
    );
    expect(css).toMatch(
      new RegExp(
        `prefers-reduced-motion: reduce.*--motion-${name}-duration: 0s;`,
      ),
    );
  }
});
