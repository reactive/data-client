import type { Carrier } from './drag';
import type { Point } from './glide';

/**
 * Carrying `el` into one of `groups`: those it can go to (not its own) are
 * `data-drop-target` while it's carried, the one under the pointer
 * `data-drop-over`. A drop lands in a group, not at a place in it;
 * `drop(group)` says whether it took.
 */
export function intoGroups(
  el: HTMLElement,
  groups: Iterable<HTMLElement>,
  drop: (group: HTMLElement) => boolean,
): Carrier {
  const targets = [...groups].filter(group => !group.contains(el));
  let over: HTMLElement | undefined;
  return {
    lift() {
      for (const group of targets) group.dataset.dropTarget = '';
    },
    move(point) {
      const hit = groupAt(targets, point);
      if (hit === over) return;
      if (over) delete over.dataset.dropOver;
      if (hit) hit.dataset.dropOver = '';
      over = hit;
    },
    drop() {
      unmark();
      return !!over && drop(over);
    },
    cancel: unmark,
  };
  function unmark() {
    for (const group of targets) {
      delete group.dataset.dropTarget;
      delete group.dataset.dropOver;
    }
  }
}

/** The innermost group under `point` */
function groupAt(groups: HTMLElement[], { x, y }: Point) {
  let hit: HTMLElement | undefined;
  for (const group of groups) {
    const { left, right, top, bottom } = group.getBoundingClientRect();
    if (x < left || x > right || y < top || y > bottom) continue;
    if (!hit || hit.contains(group)) hit = group;
  }
  return hit;
}
