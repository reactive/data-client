# Motion

Physical, interruptible animation for the website. Things move like objects
with mass: they take time to get going, settle without a hard stop, and a
change of mind mid-flight turns them around with their momentum instead of
restarting.

## Using it

Pick motion by what moves, never by milliseconds:

| Token            | For                                         |
| ---------------- | ------------------------------------------- |
| `springs.snappy` | small, light things: arrows, chips, toggles |
| `springs.smooth` | panels and drawers that carry content       |

**CSS transitions** (state changes styled by a class, like a rotating arrow):

```css
.arrow {
  transition: transform var(--motion-snappy);
}
```

**View transitions** (React `<ViewTransition>`, whose animation names are
set elsewhere) take the spring in parts:

```css
::view-transition-group(.indicator) {
  animation-duration: var(--motion-snappy-duration);
  animation-timing-function: var(--motion-snappy-easing);
}
```

Only `<ViewTransition>`s animate: the page root has no view-transition name,
so everything else lands at once instead of cross-fading. Docs tabs
(`src/theme/Tabs`) use this to slide like native tabs.

**Layout changes** (something opens, so things move):

```tsx
import { MotionGroup, Reveal, useLayoutMotion } from '../motion';

function Drawer({ open }: { open: boolean }) {
  return (
    // where the state lives; layoutDependency says which change to animate
    <MotionGroup layoutDependency={open}>
      <Content />
      <Handle />
      {/* slides in from the end of its flex container, out the same way */}
      <Reveal show={open} className={styles.panel}>
        <Panel />
      </Reveal>
    </MotionGroup>
  );
}

function Handle() {
  // inside the group: glides to its new spot instead of jumping
  const ref = useLayoutMotion();
  return <div ref={ref} className={styles.handle} />;
}
```

`Reveal` follows the flex direction, so a panel that slides in sideways on
desktop rises from the bottom when a container query stacks it. It slides
over its siblings, and its contents fill it: clip it with `overflow: hidden`
on an ancestor, and make its parent `position: relative` (exits are pinned
there while they leave).

Reduced motion (`prefers-reduced-motion: reduce`) lands everything in place
instantly, in CSS and JS alike.

## Why it is built this way

- **FLIP, translate only.** React commits the final layout at once; each
  member is measured before and after, then animated from where it was to
  where it is with `translate`. Content is never scaled, so text never
  distorts, and layout is never animated, so no frame re-runs layout.
- **Compositor-driven.** Animations are Web Animations with keyframes sampled
  from the spring, so the browser runs them off the main thread. Opening the
  Store mounts an expensive tree in the same moment; a JS (rAF) animation
  would stutter exactly then, this one does not.
- **Springs, not easing curves.** `spring.ts` solves a damped harmonic
  oscillator in closed form from a perceptual `duration` and `bounce`.
  Knowing the exact position and velocity at any instant is what lets an
  interruption continue smoothly.
- **Not React `<ViewTransition>` for layout** (React 19.3): it animates
  snapshots, blocks clicks while running, can't hand velocity to a reversal,
  and only runs for transition updates (the Store's open state is a
  synchronous store). It suits discrete switches that needn't be interrupted,
  like docs tabs.
- **Not Motion (framer-motion) `layout`**: it computes layout animations on
  the main thread every frame, and adds tens of KB.

## Files

```
spring.ts         spring physics, keyframe sampling, CSS linear() easing
tokens.ts         the named springs
css.ts            global CSS (springs as custom properties, Reveal's box),
                  injected into every page by a plugin in docusaurus.config.ts
glide.ts          runs and retargets one element's translate (Web Animations)
MotionGroup.tsx   measures before/after a commit; drives members; useLayoutMotion
Reveal.tsx        presence: mount, slide in, slide out, hide (state kept)
```

Tests: `yarn test --selectProjects ReactDOM --testPathPatterns website/src/components/motion`
