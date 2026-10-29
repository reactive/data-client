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
| `springs.brisk`  | items trading places in a list (`Reorder`)  |
| `springs.smooth` | panels and drawers that carry content       |

**CSS transitions** (state changes styled by a class, like a rotating arrow):

```css
.arrow {
  transition: transform var(--motion-snappy);
}
```

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

**Lists that rearrange** (a sort, a filter, a row moving to another group):

```tsx
import { Reorder, useReorderItem } from '../motion';

function Board({ todos }: { todos: Todo[] }) {
  const byOwner = Map.groupBy(todos, todo => todo.userId);
  return (
    // where the list is read; it renders no element of its own
    <Reorder layoutDependency={todos}>
      {[...byOwner].map(([userId, ownerTodos]) => (
        <Group key={userId} userId={userId} todos={ownerTodos} />
      ))}
    </Reorder>
  );
}

function Row({ todo }: { todo: Todo }) {
  // keyed by id, so the row is followed when React remounts it in another group
  return <li ref={useReorderItem(todo.id)}>{todo.title}</li>;
}
```

Items are found by key, not by element, so a row React remounts under a new
parent still glides there from where it was. An item inside another moving
item (a row in a group that moves) rides along and travels only the rest of
the way; a new key fades in. Items crossing the others (moving at least half
as far as the farthest) carry `data-traveling` until they land, for a style that lifts them over the rest
(`position: relative`, a `z-index`, a background). Use `MotionGroup` where things open and close in
place, `Reorder` where items change places.

**Dragging into groups**: `useReorderItem(id, { onDrop })` lets the reader
drag an item, and `useReorderItem(key, { dropValue })` makes an item a group
to drop it in; `onDrop` gets that group's `dropValue`, and the list's change
glides the item on from where it was let go. A mouse lifts it once it moves,
a finger after a short still hold (a swipe still scrolls); presses on its
controls stay theirs, and Escape puts it back. While carried it is
`data-dragging`, the groups it can go to `data-drop-target` and the one under
it `data-drop-over`. A drop lands in the group, not at a place in it.

`Reveal` follows the flex direction, so a panel that slides in sideways on
desktop rises from the bottom when a container query stacks it. It slides
over its siblings, and its contents fill it: clip it with `overflow: hidden`
on an ancestor, and make its parent `position: relative` (exits are pinned
there while they leave). Once out, it leaves the layout, which can move the
page: `hold` names an element (the toggle that closed it) to keep in place
on screen.

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
- **Not React `<ViewTransition>`** (React 19.3): it animates snapshots, blocks
  input while running, can't hand velocity to a reversal, and only runs for
  transition updates (the Store's open state is a synchronous store).
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
reorder.ts        lists that rearrange, DOM only: measure, then glide items by key
drag.ts           carrying an element under the pointer, DOM only
Reorder.tsx       its React binding: measures when layoutDependency changes;
                  useReorderItem; drag into groups
```

Tests: `yarn test --selectProjects ReactDOM --testPathPatterns website/src/components/motion`
