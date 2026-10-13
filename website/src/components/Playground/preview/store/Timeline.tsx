import clsx from 'clsx';
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  actionName,
  groupEntriesOf,
  groupOf,
  joinedFetches,
  type ActionGroup,
  type RequestGroup,
  type SubjectFilter,
} from './actionGroups';
import type ActionLog from './actionLog';
import type { History, LogEntry } from './actionLog';
import { ActionName } from './actionParts';
import {
  CATCH_UP_MS,
  droppedIn,
  droppedText,
  FOLLOW_SLACK,
  notKept,
  KeyLabel,
  seconds,
  Time,
  typeClass,
  useActions,
  useFollow,
  type Actions,
} from './actionParts';
import { NARROW_WIDTH } from './columns';
import { useHoldFocus, useWidth } from './dom';
import { actionId } from './model';
import { useNavState } from './nav';
import type { OnPreview } from './Preview';
import styles from './store.module.css';
import { useTabStorage } from '../../../../utils/tabStorage';

/** Pixels per millisecond between two actions */
const PX_PER_MS = 0.08;
/** Closest two actions get (px), so a burst stays apart */
const MIN_GAP = 12;
/** Farthest two actions get (px): an idle stretch shows as a break */
const MAX_GAP = 84;
/** Space before the first action and after the last (px) */
const PAD = 24;
/** Closest two axis labels get (px) */
const LABEL_GAP = 64;
/** The lane labels' column (px, as `--tl-label`), by panel width */
const LABEL_WIDTH = { wide: 136, narrow: 88 };
/** A lane's height (px, as `--tl-row`) */
const ROW = 18;
/** How long a finger holds still on a track before it previews (ms) */
const HOLD_MS = 350;
/** How far a finger moves before the hold is a scroll instead (px) */
const SLOP = 8;

/** Where each action sits along the timeline */
export interface TimeScale {
  /** By seq: px from the start */
  readonly x: ReadonlyMap<number, number>;
  /** Px of the last action: where what is still open runs to */
  readonly end: number;
  /** Px wide, padding included */
  readonly width: number;
  /** Px where an idle stretch was cut short */
  readonly breaks: readonly number[];
}

/** Places `entries` by time, squeezed: bursts spread to `MIN_GAP` and idle
 * stretches shrink to `MAX_GAP`, so the rhythm of requests and polls shows
 * without a burst piling up or a pause running off the screen */
export function timeScale(entries: readonly LogEntry[]): TimeScale {
  const x = new Map<number, number>();
  const breaks: number[] = [];
  let pos = PAD;
  let prev: LogEntry | undefined;
  for (const entry of entries) {
    if (prev) {
      const gap = Math.max(0, entry.at - prev.at) * PX_PER_MS;
      if (gap > MAX_GAP) breaks.push(pos + MAX_GAP / 2);
      pos += Math.min(MAX_GAP, Math.max(MIN_GAP, gap));
    }
    x.set(entry.seq, pos);
    prev = entry;
  }
  return { x, end: pos, width: pos + PAD, breaks };
}

/** One row of the timeline: every group about one key */
export interface Lane {
  readonly key: string;
  readonly groups: readonly ActionGroup[];
}

/** Groups by key, in the order each key first shows up */
export function lanesOf(groups: readonly ActionGroup[]): Lane[] {
  const lanes = new Map<string, ActionGroup[]>();
  for (const group of groups) {
    const lane = lanes.get(group.key);
    if (lane) lane.push(group);
    else lanes.set(group.key, [group]);
  }
  return [...lanes].map(([key, groups]) => ({ key, groups }));
}

/** The shown history: without the fetches deduped into a request in
 * flight (they add nothing to see), which `joined` holds */
function shownOf(groups: readonly ActionGroup[], entries: readonly LogEntry[]) {
  const joined = new Set(groups.flatMap(g => [...joinedFetches(g).keys()]));
  return { joined, shown: entries.filter(e => !joined.has(e)) };
}

/** The shown history on `timeScale` */
function useScale(actions: Actions) {
  // from the history alone: stepping through moments leaves the marks be
  const { groups, history } = actions;
  const { entries } = history;
  const { joined, shown } = useMemo(
    () => shownOf(groups, entries),
    [groups, entries],
  );
  const scale = useMemo(() => timeScale(shown), [shown]);
  return { joined, shown, scale };
}

/** `drawer` for the shown history with the moment selected, and `decor`:
 * the scale's breaks and the moment's playhead */
function useDrawer(
  actions: Actions,
  hit: SubjectFilter['hit'],
  onSelect: (seq: number) => void,
) {
  const { log, history } = actions;
  const { seq: selected } = useNavState();
  const { joined, shown, scale } = useScale(actions);
  const draw = drawer({
    log,
    scale,
    joined,
    since: history.since,
    selected,
    hit,
    onSelect,
  });
  const at = selected === null ? undefined : scale.x.get(selected);
  const decor = () => (
    <>
      {scale.breaks.map(x => (
        <span key={x} className={styles.tlBreak} style={draw.pos(x)} />
      ))}
      {at !== undefined && (
        <span className={styles.tlPlayhead} style={draw.pos(at)} />
      )}
    </>
  );
  return { ...draw, shown, scale, decor };
}

/** Draws groups along `scale`: requests as spans from fetch to response,
 * everything else as marks, placed as fractions of the track (`--tl-f`).
 * Picking an action the store saw makes it the moment. The marks `hit` says left the subject alone are dimmed */
function drawer({
  log,
  scale,
  joined,
  since,
  selected,
  hit,
  onSelect,
}: {
  log: ActionLog;
  scale: TimeScale;
  joined: ReadonlySet<LogEntry>;
  since: number;
  selected: number | null;
  hit: SubjectFilter['hit'];
  onSelect: (seq: number) => void;
}) {
  const frac = (x: number) => x / scale.width;
  const pos = (x: number) => ({ '--tl-f': frac(x) }) as React.CSSProperties;
  const labelOf = (entry: LogEntry) =>
    `${actionName(entry.action)} at ${seconds(entry.at - since)}s`;
  // every action is its own mark: none merge, so a track too narrow for
  // them scrolls rather than squeezing them together
  const mark = (entry: LogEntry, extra?: string) => {
    const label = labelOf(entry);
    const style = pos(scale.x.get(entry.seq)!);
    const type = typeClass(entry);
    // only an action the store saw has a state to show
    return entry.store ?
        <button
          key={entry.seq}
          type="button"
          tabIndex={-1}
          className={clsx(styles.tlMark, type, extra)}
          style={style}
          aria-label={label}
          data-id={actionId(entry.seq)}
          data-selected={entry.seq === selected || undefined}
          data-dim={!hit(entry) || undefined}
          onClick={() => onSelect(entry.seq)}
        />
      : <span
          key={entry.seq}
          className={clsx(styles.tlMark, styles.tlHollow, type, extra)}
          style={style}
          role="img"
          aria-label={label}
          data-id={actionId(entry.seq)}
        />;
  };
  const span = (from: number, to: number, className: string, key: string) => (
    <span
      key={key}
      className={className}
      style={{ ...pos(from), '--tl-w': frac(to - from) } as React.CSSProperties}
    />
  );
  const request = (group: RequestGroup) => {
    // without the fetches deduped into it
    const own = group.entries.filter(e => !joined.has(e));
    const first = own[0];
    const to =
      group.response ? scale.x.get(group.response.seq)!
      : group.cancelled ? scale.x.get(own.at(-1)!.seq)!
      : scale.end;
    // as the list's lifecycle shows it: a fetch that changed the store
    const optimistic = log.changed(first);
    return [
      span(scale.x.get(first.seq)!, to, styles.tlSpan, `span ${group.id}`),
      ...own.map(e =>
        mark(e, e === first && optimistic ? styles.tlOptimistic : undefined),
      ),
    ];
  };
  /** A group in its lane; `boxed`, a subscription's span frames its ticks and
   * requests (in one shared lane it would frame everything else too) */
  const drawn = (group: ActionGroup, boxed = true) => {
    if (group.kind === 'request') return request(group);
    if (group.kind === 'single') return [mark(group.entries[0])];
    const from = scale.x.get(group.entries[0].seq)!;
    const to =
      group.open > 0 ? scale.end : scale.x.get(group.entries.at(-1)!.seq)!;
    return [
      ...(boxed ?
        [span(from, to, styles.tlSubscription, `span ${group.id}`)]
      : []),
      ...group.entries.map(e => mark(e)),
      ...group.requests.flatMap(request),
    ];
  };
  return { pos, drawn };
}

/** The entry whose mark is nearest `x` on `scale` (`entries` in its order) */
export function nearest(
  entries: readonly LogEntry[],
  scale: TimeScale,
  x: number,
) {
  const at = (i: number) => scale.x.get(entries[i].seq)!;
  let lo = 0;
  let hi = entries.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (at(mid) < x) lo = mid + 1;
    else hi = mid;
  }
  return entries[lo > 0 && x - at(lo - 1) <= at(lo) - x ? lo - 1 : lo];
}

/** Whether `live` leaves every mark `was` showed on a track `strip` px
 * wide (0: not measured yet) where it was: actions only ever come after
 * the newest or drop out, so the marks move only as one drops, or as the
 * track runs past the strip (detailed, it scrolls to the newest; fit, it
 * squeezes) */
export function still(was: Actions, live: Actions, strip: number) {
  const before = shownOf(was.groups, was.history.entries).shown;
  const after = shownOf(live.groups, live.history.entries).shown;
  return (
    before.every((e, i) => after[i] === e) &&
    // none added (a fetch joining one in flight shows nothing)
    (after.length === before.length ||
      !strip ||
      timeScale(after).width <= strip)
  );
}

/** The actions as `track` shows them: `on` (the pointer on it, as
 * `setOn` says), what it showed as the pointer came stays until a change
 * leaves its marks where they are (`still`), so nothing moves under the
 * pointer; `behind` says a change waits. Off, it catches up: `catchingUp`
 * while the marks move to where they are now rather than jump
 * (`[data-catchup]` in store.module.css). `strip` is the track's width;
 * hidden, it measures 0 */
function useHeld(track: React.RefObject<HTMLElement | null>) {
  const live = useActions();
  const strip = useWidth(track, 0);
  const [on, setOn] = useState(false);
  // what it shows while on; off, nothing holds, so it keeps none
  const [was, setWas] = useState<Actions>();
  const [wasBehind, setWasBehind] = useState(false);
  const [catchingUp, setCatchingUp] = useState(false);
  const behind = useMemo(
    () => on && !!was && was !== live && !still(was, live, strip),
    [on, was, live, strip],
  );
  if (on) {
    if (!behind && was !== live) setWas(live);
  } else if (was) setWas(undefined);
  if (wasBehind !== behind) {
    setWasBehind(behind);
    // from the render that lets go, so its move is the one that transitions
    if (!behind) setCatchingUp(true);
  }
  useEffect(() => {
    if (!catchingUp) return;
    const timer = setTimeout(() => setCatchingUp(false), CATCH_UP_MS);
    return () => clearTimeout(timer);
  }, [catchingUp]);
  return {
    actions: behind && was ? was : live,
    setOn,
    strip,
    behind,
    catchingUp,
  };
}

/** What a held track says of itself, as `[data-held]` tints it (see
 * store.module.css) */
const HELD = 'Paused while the pointer is on the timeline; new actions wait';

/** Previews the action nearest the pointer on `track`'s lane under it,
 * under `anchor`: as
 * the mouse moves over it, or, once a finger has held still on it, as the
 * finger slides (the track doesn't scroll meanwhile, and lifting it picks
 * nothing). `onHold` says the pointer is on the track (the mouse over it,
 * or a finger holding), and when it has gone */
function useTrackPreview(
  track: React.RefObject<HTMLElement | null>,
  anchor: React.RefObject<HTMLElement | null>,
  /** Each `[data-lane]`'s entries, in order */
  lanes: readonly (readonly LogEntry[])[],
  scale: TimeScale,
  onPreview: OnPreview,
  onHold: (on: boolean) => void,
) {
  const latest = useRef({ lanes, scale, onPreview, onHold });
  useLayoutEffect(() => {
    latest.current = { lanes, scale, onPreview, onHold };
  });
  // a new scale (new marks came, or squeezed in) moved the marks under a
  // still pointer: previews what it is on now
  const refresh = useRef<() => void>(undefined);
  useLayoutEffect(() => {
    refresh.current?.();
  }, [scale]);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // where the previewing pointer is
    let pointer: { x: number; y: number } | undefined;
    const preview = (x: number, y: number, now?: boolean) => {
      pointer = { x, y };
      const { lanes, scale, onPreview } = latest.current;
      // the lane the pointer is on, or (over the axis) the nearest: lanes
      // stack edge to edge at one height and width (`.tlLane`, no margin),
      // so the first one's box places them all
      const box = el.querySelector('[data-lane]')?.getBoundingClientRect();
      // no height: no lanes, or hidden
      if (!box?.height) return onPreview(null);
      const i = Math.floor((y - box.top) / box.height);
      const shown = lanes[Math.min(Math.max(i, 0), lanes.length - 1)];
      // no actions under it: nothing to show, till some come
      if (!shown?.length) return onPreview(null);
      const entry = nearest(
        shown,
        scale,
        ((x - box.left) / box.width) * scale.width,
      );
      onPreview(
        {
          entry,
          x: box.left + (scale.x.get(entry.seq)! / scale.width) * box.width,
          anchor: anchor.current ?? el,
        },
        now,
      );
    };
    const hide = () => {
      pointer = undefined;
      latest.current.onPreview(null);
    };
    const setOn = (on: boolean) => latest.current.onHold(on);
    const onMoved = () => {
      if (pointer) preview(pointer.x, pointer.y);
    };
    refresh.current = onMoved;
    // held, the finger slides the preview: the track doesn't scroll, nor
    // the long press open a menu. Only then, so a plain swipe scrolls
    // without waiting on these
    const holding = (e: Event) => e.preventDefault();
    const held = ['touchmove', 'contextmenu'] as const;
    // a finger on the track: held still, it previews
    let hold:
      | {
          id: number;
          x: number;
          y: number;
          timer: ReturnType<typeof setTimeout>;
          on: boolean;
        }
      | undefined;
    // the click a held finger lifting makes
    let swallow = false;
    // `lifted`: the finger came up (rather than the browser cancelling the
    // gesture), so a click follows
    const letGo = (lifted = false) => {
      if (!hold) return;
      clearTimeout(hold.timer);
      swallow = lifted && hold.on;
      if (hold.on) {
        hide();
        setOn(false);
        for (const type of held)
          el.removeEventListener(type, holding, { capture: true });
      }
      hold = undefined;
    };
    const onDown = (e: PointerEvent) => {
      // a lift that made no click leaves nothing for a later press to lose
      swallow = false;
      // a press says where the pointer is going, as a tooltip shuts on one
      if (e.pointerType !== 'touch') {
        hide();
        return;
      }
      if (!e.isPrimary) return;
      letGo();
      // a finger shuts what the mouse left open, till it holds
      hide();
      const h = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        on: false,
        timer: setTimeout(() => {
          h.on = true;
          for (const type of held)
            el.addEventListener(type, holding, {
              capture: true,
              passive: false,
            });
          setOn(true);
          preview(h.x, h.y, true);
        }, HOLD_MS),
      };
      hold = h;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return preview(e.clientX, e.clientY);
      if (e.pointerId !== hold?.id) return;
      if (hold.on) preview(e.clientX, e.clientY, true);
      else if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > SLOP)
        letGo();
    };
    // the mouse's own coming and going (the marks' don't bubble, but reach
    // the capturing track too)
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' && e.target === el) setOn(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      hide();
      if (e.target === el) setOn(false);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === hold?.id) letGo(e.type === 'pointerup');
    };
    const onClick = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const listeners = [
      ['pointerdown', onDown],
      ['pointermove', onMove],
      ['pointerenter', onEnter],
      ['pointerleave', onLeave],
      ['pointerup', onUp],
      ['pointercancel', onUp],
      ['click', onClick],
      // the marks moved under the pointer
      ['scroll', onMoved],
    ] as const;
    // capturing: ahead of the track's follow, which a held finger mustn't
    // move (see `useFollow`), and of the mark's own click
    const options = { capture: true };
    for (const [type, fn] of listeners)
      el.addEventListener(type, fn as EventListener, options);
    // and as the track resizes, which moves the marks of a fitted one
    const resized =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(onMoved)
      );
    resized?.observe(el);
    return () => {
      for (const [type, fn] of listeners)
        el.removeEventListener(type, fn as EventListener, options);
      resized?.disconnect();
      letGo();
      // only its own: another track's may be showing
      if (pointer) hide();
      setOn(false);
    };
  }, [track, anchor]);
}

/** Keeps a sideways-scrolling track drawn on `scale` on the moment: live,
 * on the newest as actions come in, until scrolled back; scrolled back or
 * picked, the marks in view stay put as actions come in or the oldest drop.
 * The picked action comes into view as it is picked or `refocus` (another
 * input to the track's layout) changes. Returns End's step: back to
 * live, or live already, back to the newest */
function useTrackFollow(
  scroller: React.RefObject<HTMLElement | null>,
  scale: TimeScale,
  /** The marks are catching up (`useHeld`): it springs along with them */
  catchingUp: boolean,
  refocus?: unknown,
) {
  const { seq: selected, set } = useNavState();
  // a new scale for every change to the history, trims included, so the
  // marks in view are held even when the width stays the same
  const layout = useMemo(() => [scale, refocus], [scale, refocus]);
  const followNewest = useFollow(
    scroller,
    layout,
    'x',
    selected !== null,
    catchingUp,
  );
  useLayoutEffect(() => {
    if (selected === null) return;
    scroller.current
      ?.querySelector('[data-selected]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [scroller, selected, refocus]);
  return () => (selected === null ? followNewest() : set(null));
}

/** The whole history in one lane, scrolling sideways, with the moment
 * on it: ‹ › and the arrow keys step through the actions `hit` says
 * touched the subject (past the newest is live, as End is), a mark lands on
 * its action. Its actions as a list sit beside the ▾: they peek as the mouse rests
 * there, and open in full on a click. Says which action the moment is
 * after, while it is in the past, opening it in the Action tab; `▾` expands
 * the timeline */
export const Scrubber = memo(function Scrubber({
  entry,
  hit,
  onMark,
  expanded,
  expandRef,
  onExpand,
  listed,
  listRef,
  onList,
  onListHover,
  onPreview,
}: {
  /** The moment's action; missing while live */
  entry?: LogEntry;
  /** The subject's actions; the others' marks dim */
  hit: SubjectFilter['hit'];
  /** A mark picked (not as ‹ › step): makes it the moment */
  onMark: (seq: number) => void;
  /** Whether the timeline is shown under it */
  expanded: boolean;
  /** The ▾, for focus to return to as the timeline shuts */
  expandRef?: React.Ref<HTMLButtonElement>;
  onExpand: (expanded: boolean) => void;
  /** The list is shown in full */
  listed: boolean;
  /** The list's button, which a press outside the peek leaves it open on */
  listRef?: React.Ref<HTMLButtonElement>;
  onList: () => void;
  /** The pointer came onto the list's button (`true`) or left it */
  onListHover: (inside: boolean, e: React.PointerEvent) => void;
  onPreview: OnPreview;
}) {
  // the track scrolls sideways, on the moment as the timeline's does
  const track = useRef<HTMLDivElement>(null);
  // the pointer on the track: what it shows holds still
  const { actions, setOn, behind, catchingUp } = useHeld(track);
  const { groups } = actions;
  const { whole, earlier, later, set: onSelect, show } = useNavState();
  // a row picked stands for its whole group: the label names that
  const group = whole && entry ? groupOf(groups, entry.seq) : undefined;
  const { shown, scale, drawn, decor } = useDrawer(actions, hit, onMark);
  const end = useTrackFollow(track, scale, catchingUp);

  // a step that removes (Live) or turns off (an end reached) the button
  // pressed hands focus to one still there
  const bar = useRef<HTMLDivElement>(null);
  const hold = useHoldFocus(bar);
  useTrackPreview(track, bar, [shown], scale, onPreview, setOn);
  const step = (to: number | null) => {
    hold();
    onSelect(to);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    // ← → step as they do across the panel, which takes them on from here
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') hold();
    else if (e.key === 'End') {
      e.preventDefault();
      hold();
      end();
    }
  };

  return (
    <div
      ref={bar}
      className={styles.scrubber}
      tabIndex={0}
      role="group"
      aria-label="Scrubber: arrow keys step through changes, End returns to live"
      aria-description={behind ? HELD : undefined}
      onKeyDown={onKeyDown}
    >
      <div className={styles.scrubRow} data-held={behind || undefined}>
        <button
          type="button"
          data-step
          aria-label="Previous change"
          disabled={earlier === undefined}
          onClick={() => earlier !== undefined && step(earlier)}
        >
          ‹
        </button>
        <button
          type="button"
          data-step
          aria-label="Next change"
          disabled={later === undefined}
          onClick={() => later !== undefined && step(later)}
        >
          ›
        </button>
        <div
          ref={track}
          className={styles.scrubTrack}
          data-track
          style={{ '--tl-width': `${scale.width}px` } as React.CSSProperties}
          data-catchup={catchingUp || undefined}
        >
          {shown.length > 0 && (
            <div className={styles.tlLane} data-lane>
              {groups.flatMap(g => drawn(g, false))}
              {decor()}
            </div>
          )}
        </div>
        {entry ?
          <button
            type="button"
            className={styles.liveButton}
            onClick={() => step(null)}
          >
            Live
          </button>
        : <span
            className={clsx(styles.liveButton, !behind && styles.liveCurrent)}
            aria-current={behind ? undefined : 'true'}
            title={behind ? HELD : 'Showing the newest action'}
          >
            Live
          </span>
        }
        <button
          type="button"
          ref={listRef}
          className={styles.expand}
          aria-label="Actions"
          title="Actions"
          aria-pressed={listed}
          onPointerEnter={e => !listed && onListHover(true, e)}
          onPointerLeave={e => onListHover(false, e)}
          onClick={onList}
        >
          <ListIcon />
        </button>
        <button
          type="button"
          ref={expandRef}
          className={styles.expand}
          aria-label="Timeline"
          title="Timeline"
          aria-expanded={expanded}
          onClick={() => onExpand(!expanded)}
        >
          <ChevronIcon />
        </button>
      </div>
      {entry && (
        <div className={styles.scrubLabel}>
          After{' '}
          <button
            type="button"
            className={styles.momentAction}
            title="Show action"
            onClick={() => show(entry.seq, !!group)}
          >
            {group ?
              <KeyLabel value={group.key} />
            : <ActionName entry={entry} />}
          </button>
          <span className={styles.dim}>
            {' · '}
            <Time at={entry.at} />
          </span>
        </div>
      )}
    </div>
  );
});

/** The expanded timeline: the shown store's actions on one time axis, a
 * lane per key, requests as spans from fetch to response, everything else as
 * marks. Picking an action the store saw makes it the moment; the arrow keys step as the scrubber's ‹ › do */
export default memo(function Timeline({
  width,
  hit,
  onMark,
  onPreview,
}: {
  /** Panel width (px) */
  width: number;
  /** The subject's actions; the others' marks dim */
  hit: SubjectFilter['hit'];
  /** A mark picked (not as the keys step): makes it the moment */
  onMark: (seq: number) => void;
  onPreview: OnPreview;
}) {
  const { seq: selected } = useNavState();
  const [spacing, setSpacing] = useTabStorage('playgroundTimelineSpacing');
  const narrow = width < NARROW_WIDTH;
  const labelWidth = narrow ? LABEL_WIDTH.narrow : LABEL_WIDTH.wide;
  // detailed (the default), it scrolls sideways, kept on the newest while
  // live; fit, the whole history spans the strip
  const fit = spacing === 'fit';
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // the pointer on the tracks: what they show holds still
  const { actions, setOn, strip, behind, catchingUp } = useHeld(scroller);
  const { history, groups } = actions;
  const { entries, since } = history;
  const lanes = useMemo(() => lanesOf(groups), [groups]);
  const { shown, scale, pos, drawn, decor } = useDrawer(actions, hit, onMark);
  // the strip's width for the scale's: fit, the labels thin out as the
  // history squeezes (whole px, so resizing rarely relabels). Hidden,
  // label as detailed until it shows
  const track = fit && strip ? Math.min(scale.width, strip) : scale.width;
  const gap = Math.ceil((LABEL_GAP * scale.width) / track);
  const labels = useMemo(
    () => axisLabels(shown, scale, gap),
    [shown, scale, gap],
  );

  // each lane's own marks, so the preview is of the lane under the pointer
  const laneEntries = useMemo(() => {
    const laneOf = new Map<LogEntry, number>();
    lanes.forEach((lane, i) =>
      lane.groups.forEach(g =>
        groupEntriesOf(g).forEach(e => laneOf.set(e, i)),
      ),
    );
    // in order already, as `shown` is
    const each = lanes.map((): LogEntry[] => []);
    for (const e of shown) {
      const i = laneOf.get(e);
      if (i !== undefined) each[i].push(e);
    }
    return each;
  }, [lanes, shown]);
  useTrackPreview(scroller, root, laneEntries, scale, onPreview, setOn);
  // a scrolled-back view stays put as the fit toggles, while a followed one
  // stays on the newest; the picked action comes into view again
  const end = useTrackFollow(scroller, scale, catchingUp, fit);
  // scrolled back, fitting and back returns to where it was, unless it went
  // to the newest (or live) meanwhile
  const scrolledTo = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (selected === null) scrolledTo.current = null;
  }, [selected]);
  const toggleFit = () => {
    const el = scroller.current;
    if (!fit && el) {
      const back = el.scrollWidth - el.scrollLeft - el.clientWidth;
      scrolledTo.current = back >= FOLLOW_SLACK ? el.scrollLeft : null;
    }
    setSpacing(fit ? 'detailed' : 'fit');
  };
  useLayoutEffect(() => {
    if (fit) return;
    const to = scrolledTo.current;
    scrolledTo.current = null;
    // past the newest it went to while following through the fit; the
    // scroll this makes lets go again
    if (to !== null && selected === null) scroller.current!.scrollLeft = to;
    // only as it comes back from fit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit]);

  // ← → step as they do across the panel, which takes them on from here;
  // End returns to live (live already, it brings the newest back into
  // view). Escape is the levels' way back, so it stays theirs
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'End':
        scrolledTo.current = null;
        end();
        break;
      // the lanes scroll from here, as a focused scroller's would
      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown': {
        const el = scroller.current;
        if (!el) return;
        const by = e.key.startsWith('Page') ? el.clientHeight - ROW : ROW;
        el.scrollTop += e.key.endsWith('Up') ? -by : by;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
  };

  // the lane labels stay put beside the scrolling tracks, the two kept at
  // one height
  const labelColumn = useRef<HTMLDivElement>(null);
  const syncTop = (from: HTMLElement | null, to: HTMLElement | null) => {
    if (from && to && to.scrollTop !== from.scrollTop)
      to.scrollTop = from.scrollTop;
  };

  return (
    <div
      ref={root}
      className={styles.tlLanes}
      style={{ '--tl-label': `${labelWidth}px` } as React.CSSProperties}
      tabIndex={0}
      role="group"
      aria-label="Timeline: arrow keys step through changes, End returns to live"
      aria-description={behind ? HELD : undefined}
      onKeyDown={onKeyDown}
    >
      <div
        ref={labelColumn}
        className={styles.tlLabels}
        hidden={!entries.length}
        onScroll={() => {
          syncTop(labelColumn.current, scroller.current);
          // past the tracks' end, the labels come back to it
          syncTop(scroller.current, labelColumn.current);
        }}
      >
        <span className={clsx(styles.tlLabel, styles.tlCorner)}>
          <button
            type="button"
            className={styles.tlFit}
            aria-label="Fit timeline"
            title="Fit the whole timeline"
            aria-pressed={fit}
            onClick={toggleFit}
          >
            <FitIcon />
          </button>
        </span>
        {lanes.map(lane => (
          <span key={lane.key} className={styles.tlLabel}>
            {lane.key ?
              <KeyLabel value={lane.key} />
            : <span className={styles.dim}>store</span>}
          </span>
        ))}
      </div>
      {/* the scroller stays mounted, so following starts with the first
      action */}
      <div
        ref={scroller}
        className={styles.tlScroller}
        data-held={behind || undefined}
        onScroll={() => syncTop(scroller.current, labelColumn.current)}
      >
        {!entries.length && (
          <p className={styles.empty}>
            Nothing dispatched yet. Actions show on the timeline as the preview
            runs.
          </p>
        )}
        <div
          className={styles.tlBody}
          hidden={!entries.length}
          data-fit={fit || undefined}
          data-catchup={catchingUp || undefined}
          style={{ '--tl-width': `${scale.width}px` } as React.CSSProperties}
        >
          <div className={styles.tlAxis}>
            {labels.map(({ seq, x, at }) => (
              <span key={seq} className={styles.tlTime} style={pos(x)}>
                {seconds(at - since)}s
              </span>
            ))}
          </div>
          {lanes.map(lane => (
            <div key={lane.key} className={styles.tlLane} data-lane>
              <LaneDropped lane={lane} dropped={history.dropped} />
              {lane.groups.flatMap(g => drawn(g))}
            </div>
          ))}
          {decor()}
        </div>
      </div>
    </div>
  );
});

/** Leads a lane whose earlier actions the log no longer has, as the list
 * says it of a row */
function LaneDropped({
  lane,
  dropped,
}: {
  lane: Lane;
  dropped: History['dropped'];
}) {
  // each row's own count, as the list words it
  const counts = lane.groups.flatMap(group => {
    const n = droppedIn(groupEntriesOf(group), dropped);
    return n ? [droppedText(group, n)] : [];
  });
  if (!counts.length) return null;
  const label = notKept(counts.join('; '));
  return (
    <span
      className={clsx(styles.tlDropped, styles.dim)}
      role="img"
      title={label}
      aria-label={label}
    >
      …
    </span>
  );
}

/** Entries to label on the axis, at least `gap` (scale px) apart */
export function axisLabels(
  entries: readonly LogEntry[],
  scale: TimeScale,
  gap = LABEL_GAP,
) {
  const labels: { seq: number; x: number; at: number }[] = [];
  for (const { seq, at } of entries) {
    const x = scale.x.get(seq)!;
    if (!labels.length || x - labels.at(-1)!.x >= gap)
      labels.push({ seq, x, at });
  }
  return labels;
}

/** A magnifier with a minus */
function FitIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3.5 3.5M5.5 7h3" />
    </svg>
  );
}
/** Points down; `.expand[aria-expanded='true']` turns it up */
function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6.5l4 4 4-4" />
    </svg>
  );
}

/** Rows of text */
function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4h2M6.5 4h7M2.5 8h2M6.5 8h7M2.5 12h2M6.5 12h7" />
    </svg>
  );
}
