import clsx from 'clsx';
import React, {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { ActionName } from './ActionDetail';
import {
  actionName,
  groupEntriesOf,
  joinedFetches,
  type ActionGroup,
  type RequestGroup,
  type SubjectFilter,
} from './actionGroups';
import type ActionLog from './actionLog';
import { stepMoment, type LogEntry } from './actionLog';
import {
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
  useLog,
} from './ActionsView';
import { NARROW_WIDTH } from './columns';
import { useHoldFocus } from './dom';
import { useNavState } from './nav';
import styles from './store.module.css';
import { useTabStorage } from '../../../../utils/tabStorage';

/** Pixels per millisecond between two actions */
const PX_PER_MS = 0.08;
/** Closest two actions get (px), so a burst stays apart */
const MIN_GAP = 10;
/** Farthest two actions get (px): an idle stretch shows as a break */
const MAX_GAP = 56;
/** Space before the first action and after the last (px) */
const PAD = 24;
/** Closest two axis labels get (px) */
const LABEL_GAP = 64;
/** The lane labels' column (px, as `--tl-label`), by panel width */
const LABEL_WIDTH = { wide: 136, narrow: 88 };
/** A lane's height (px, as `--tl-row`) */
const ROW = 18;

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

/** The shown history on `timeScale`, without the fetches deduped into a
 * request in flight (they add nothing to see) */
/** What the scrubber's row holds beside its track: ‹ ›, Live and ▾ (px) */
const SCRUB_CONTROLS = 170;
/** Scrubber marks closer than this (px) draw as one */
const MERGE_PX = 4;

function useScale() {
  const { groups, history } = useActions();
  const joined = useMemo(
    () => new Set(groups.flatMap(g => [...joinedFetches(g).keys()])),
    [groups],
  );
  const shown = useMemo(
    () => history.entries.filter(e => !joined.has(e)),
    [history.entries, joined],
  );
  const scale = useMemo(() => timeScale(shown), [shown]);
  return { joined, shown, scale };
}

/** Draws groups along `scale`: requests as spans from fetch to response,
 * everything else as marks, placed as fractions of the track (`--tl-f`).
 * Picking an action the store saw shows State as it was right after it.
 * The marks `hit` says left the subject alone are dimmed */
function drawer({
  log,
  scale,
  joined,
  since,
  selected,
  hit,
  onSelect,
  mergeWithin,
}: {
  log: ActionLog;
  scale: TimeScale;
  joined: ReadonlySet<LogEntry>;
  since: number;
  selected: number | null;
  hit: SubjectFilter['hit'];
  onSelect: (seq: number) => void;
  /** Marks closer than this (in the scale's units) draw as one; `marks()`
   * then draws them all, after `drawn` collected them */
  mergeWithin?: number;
}) {
  const frac = (x: number) => x / scale.width;
  const pos = (x: number) => ({ '--tl-f': frac(x) }) as React.CSSProperties;
  const labelOf = (entry: LogEntry) =>
    `${actionName(entry.action)} at ${seconds(entry.at - since)}s`;
  const collected: { entry: LogEntry; extra?: string }[] = [];
  const draw = (
    entries: readonly LogEntry[],
    x: number,
    extra: string | undefined,
    key: React.Key,
  ) => {
    const label =
      entries.length === 1 ?
        labelOf(entries[0])
      : `${entries.length} actions, ${labelOf(entries[0])} to ${labelOf(entries.at(-1)!)}`;
    const style = pos(x);
    const stored = entries.filter(e => e.store);
    const last = stored.at(-1);
    const dim = stored.length > 0 && stored.every(e => !hit(e));
    const type = typeClass(last ?? entries[0]);
    // only an action the store saw has a state to show
    return last ?
        <button
          key={key}
          type="button"
          tabIndex={-1}
          className={clsx(styles.tlMark, type, extra)}
          style={style}
          title={label}
          aria-label={label}
          data-selected={entries.some(e => e.seq === selected) || undefined}
          data-dim={dim || undefined}
          data-count={entries.length > 1 ? entries.length : undefined}
          onClick={() => onSelect(last.seq)}
        />
      : <span
          key={key}
          className={clsx(styles.tlMark, styles.tlHollow, type, extra)}
          style={style}
          title={label}
        />;
  };
  const mark = (entry: LogEntry, extra?: string) => {
    if (mergeWithin !== undefined) {
      collected.push({ entry, extra });
      return null;
    }
    return draw([entry], scale.x.get(entry.seq)!, extra, entry.seq);
  };
  /** The marks `drawn` collected, those crowding each other drawn as one */
  const marks = () => {
    const sorted = collected
      .map(m => ({ ...m, x: scale.x.get(m.entry.seq)! }))
      .sort((a, b) => a.x - b.x);
    const out: React.ReactNode[] = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].x - sorted[i].x < mergeWithin!) j++;
      const cluster = sorted.slice(i, j);
      const x = (cluster[0].x + cluster[cluster.length - 1].x) / 2;
      out.push(
        draw(
          cluster.map(m => m.entry),
          x,
          cluster.length === 1 ? cluster[0].extra : undefined,
          cluster[0].entry.seq,
        ),
      );
      i = j;
    }
    return out;
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
  return { pos, drawn, marks };
}

/** The whole history in one lane, fit to the panel's width, with the moment
 * on it: ‹ › and the arrow keys step through the actions `hit` says
 * touched the subject (past the newest is live, as End is), a mark lands on
 * its action. Says which action State is shown after, while it shows the
 * past, which shows it in the Actions pane; `▾` expands the timeline */
export const Scrubber = memo(function Scrubber({
  entry,
  hit,
  width,
  expanded,
  expandRef,
  onExpand,
}: {
  /** The action State is shown after; missing while live */
  entry?: LogEntry;
  /** What the steps follow: the subject's actions */
  hit: SubjectFilter['hit'];
  /** Panel width (px), to tell which marks crowd each other */
  width: number;
  /** Whether the timeline is shown under it */
  expanded: boolean;
  /** The ▾, for focus to return to as the timeline shuts */
  expandRef?: React.Ref<HTMLButtonElement>;
  onExpand: (expanded: boolean) => void;
}) {
  const { log, history, groups } = useActions();
  const { seq: selected, set: onSelect, show } = useNavState();
  const { entries, since } = history;
  const { joined, shown, scale } = useScale();
  const earlier = stepMoment(entries, selected, -1, hit);
  const later = stepMoment(entries, selected, 1, hit);
  // the track fits the panel beside the controls: marks a few px apart
  // there draw as one (fast polling crowds it otherwise)
  const track = Math.min(scale.width, Math.max(1, width - SCRUB_CONTROLS));
  const { pos, drawn, marks } = drawer({
    log,
    scale,
    joined,
    since,
    selected,
    hit,
    onSelect,
    mergeWithin: (MERGE_PX * scale.width) / track,
  });
  const at = selected === null ? undefined : scale.x.get(selected);

  // a step that removes (Live) or turns off (an end reached) the button
  // pressed hands focus to one still there
  const bar = useRef<HTMLDivElement>(null);
  const hold = useHoldFocus(bar);
  const step = (to: number | null) => {
    hold();
    onSelect(to);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (earlier !== undefined) step(earlier);
        break;
      case 'ArrowRight':
        if (later !== undefined) step(later);
        break;
      case 'End':
        if (entry) step(null);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      ref={bar}
      className={clsx(styles.scrubber, !entry && styles.tlLive)}
      tabIndex={0}
      role="group"
      aria-label="Scrubber: arrow keys step through changes, End returns to live"
      onKeyDown={onKeyDown}
    >
      <div className={styles.scrubRow}>
        <button
          type="button"
          aria-label="Previous change"
          disabled={earlier === undefined}
          onClick={() => earlier !== undefined && step(earlier)}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next change"
          disabled={later === undefined}
          onClick={() => later !== undefined && step(later)}
        >
          ›
        </button>
        <div
          className={styles.scrubTrack}
          style={{ '--tl-width': `${scale.width}px` } as React.CSSProperties}
        >
          {shown.length > 0 && (
            <div className={styles.tlLane}>
              {groups.flatMap(g => drawn(g, false))}
              {marks()}
              {scale.breaks.map(x => (
                <span key={x} className={styles.tlBreak} style={pos(x)} />
              ))}
              {at !== undefined && (
                <span className={styles.tlPlayhead} style={pos(at)} />
              )}
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
        : <span className={styles.liveButton}>Live</span>}
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
            className={styles.snapshotAction}
            title="Show action"
            onClick={() => show(entry.seq)}
          >
            <ActionName entry={entry} />
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
 * marks. Picking an action the store saw shows State as it was right after
 * it; the arrow keys step as the scrubber's ‹ › do */
export default memo(function Timeline({
  width,
  hit,
  onPick,
}: {
  /** Panel width (px) */
  width: number;
  /** What the steps follow: the subject's actions */
  hit: SubjectFilter['hit'];
  /** Called as a pick lands on content under the timeline: a mark (not as
   * the keys step) */
  onPick?: () => void;
}) {
  const { log, history, groups } = useActions();
  const { seq: selected, set } = useNavState();
  const [spacing, setSpacing] = useTabStorage('playgroundTimelineSpacing');
  const { entries, since } = history;
  const lanes = useMemo(() => lanesOf(groups), [groups]);
  const { joined, shown, scale } = useScale();
  const narrow = width < NARROW_WIDTH;
  const labelWidth = narrow ? LABEL_WIDTH.narrow : LABEL_WIDTH.wide;
  // detailed (the default), it scrolls sideways, kept on the newest while
  // live; fit, the whole history spans the strip
  const fit = spacing === 'fit';
  // the strip's width for the scale's: fit, the labels thin out as the
  // history squeezes (whole px, so resizing rarely relabels). A hidden panel
  // measures 0: label as detailed until it shows
  const track =
    !fit || !width ?
      scale.width
    : Math.min(scale.width, Math.max(1, width - labelWidth));
  const gap = Math.ceil((LABEL_GAP * scale.width) / track);
  const labels = useMemo(
    () => axisLabels(shown, scale, gap),
    [shown, scale, gap],
  );
  const at = selected === null ? undefined : scale.x.get(selected);

  const scroller = useRef<HTMLDivElement>(null);
  // a picked action stays put as new ones come in; so does a scrolled-back
  // view as the fit toggles, while a followed one stays on the newest
  const followNewest = useFollow(
    scroller,
    `${scale.width} ${fit}`,
    'x',
    selected !== null,
  );
  // scrolled back, fitting and back returns to where it was, unless it went
  // to the newest meanwhile
  const scrolledTo = useRef<number | null>(null);
  const toNewest = useCallback(() => {
    scrolledTo.current = null;
    followNewest();
  }, [followNewest]);
  // the picked action comes into view (again as the fit changes); back to
  // live, the newest does, and the timeline follows it again
  useLayoutEffect(() => {
    if (selected === null) return toNewest();
  }, [selected, toNewest]);
  useLayoutEffect(() => {
    if (selected === null) return;
    scroller.current
      ?.querySelector('[data-selected]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selected, fit]);
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

  // the arrow keys step as the scrubber's ‹ › do; past the newest is live
  // (End too; live already, it brings the newest back into view). Escape is
  // the levels' way back, so it stays theirs
  const toLive = () => {
    if (selected === null) toNewest();
    else set(null);
  };
  const step = (by: -1 | 1) => {
    const to = stepMoment(entries, selected, by, hit);
    if (to !== undefined) set(to);
    // live already, it brings the newest back into view
    else if (by > 0) toNewest();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        step(-1);
        break;
      case 'ArrowRight':
        step(1);
        break;
      case 'End':
        toLive();
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
  const onSelect = (seq: number) => {
    set(seq);
    onPick?.();
  };
  // along the track, as a fraction of it: the track is the scale's width,
  // or what fits (see `.tlBody`)
  const { pos, drawn } = drawer({
    log,
    scale,
    joined,
    since,
    selected,
    hit,
    onSelect,
  });

  // the lane labels stay put beside the scrolling tracks, the two kept at
  // one height
  const labelColumn = useRef<HTMLDivElement>(null);
  const syncTop = (from: HTMLElement | null, to: HTMLElement | null) => {
    if (from && to && to.scrollTop !== from.scrollTop)
      to.scrollTop = from.scrollTop;
  };

  return (
    <div
      className={styles.tlLanes}
      style={{ '--tl-label': `${labelWidth}px` } as React.CSSProperties}
      tabIndex={0}
      role="group"
      aria-label="Timeline: arrow keys step through changes, End returns to live"
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
            <div key={lane.key} className={styles.tlLane}>
              <LaneDropped lane={lane} />
              {lane.groups.flatMap(g => drawn(g))}
            </div>
          ))}
          {scale.breaks.map(x => (
            <span key={x} className={styles.tlBreak} style={pos(x)} />
          ))}
          {at !== undefined && (
            <span className={styles.tlPlayhead} style={pos(at)} />
          )}
        </div>
      </div>
    </div>
  );
});

/** Leads a lane whose earlier actions the log no longer has, as the list
 * says it of a row */
function LaneDropped({ lane }: { lane: Lane }) {
  const { dropped } = useLog();
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
