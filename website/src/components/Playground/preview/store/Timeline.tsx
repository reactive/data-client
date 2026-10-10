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
} from './actionGroups';
import type ActionLog from './actionLog';
import { isRecordChange, nearestChange, type LogEntry } from './actionLog';
import {
  droppedIn,
  droppedText,
  FOLLOW_SLACK,
  KEEPS_NEWEST,
  KeyLabel,
  seconds,
  typeClass,
  useActions,
  useFollow,
  useLog,
} from './ActionsView';
import { NARROW_WIDTH } from './columns';
import { endpointId, splitKey } from './model';
import { useMoment } from './nav';
import styles from './store.module.css';
import { HistoryButton } from './VersionHistory';

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
 * Picking an action the store saw shows State as it was right after it */
function drawer({
  log,
  scale,
  joined,
  since,
  selected,
  onSelect,
}: {
  log: ActionLog;
  scale: TimeScale;
  joined: ReadonlySet<LogEntry>;
  since: number;
  selected: number | null;
  onSelect: (seq: number) => void;
}) {
  const frac = (x: number) => x / scale.width;
  const pos = (x: number) => ({ '--tl-f': frac(x) }) as React.CSSProperties;
  const mark = (entry: LogEntry, extra?: string) => {
    const label = `${actionName(entry.action)} at ${seconds(entry.at - since)}s`;
    const style = pos(scale.x.get(entry.seq)!);
    // only an action the store saw has a state to show
    return entry.store ?
        <button
          key={entry.seq}
          type="button"
          tabIndex={-1}
          className={clsx(styles.tlMark, typeClass(entry), extra)}
          style={style}
          title={label}
          aria-label={label}
          data-selected={entry.seq === selected || undefined}
          onClick={() => onSelect(entry.seq)}
        />
      : <span
          key={entry.seq}
          className={clsx(
            styles.tlMark,
            styles.tlHollow,
            typeClass(entry),
            extra,
          )}
          style={style}
          title={label}
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
  return { pos, mark, drawn };
}

/** The whole history in one lane, fit to the panel's width, with the moment
 * on it: ‹ › and the arrow keys step through changes (past the newest is
 * live, as End is), a mark lands on its action. Says which action State is
 * shown after, while it shows the past; `▾` expands the lanes */
export function Scrubber({
  entry,
  expanded,
  onExpand,
  onOpen,
}: {
  /** The action State is shown after; missing while live */
  entry?: LogEntry;
  /** Whether the lanes are shown under it */
  expanded: boolean;
  onExpand: (expanded: boolean) => void;
  /** Opens that action in the Actions list */
  onOpen: (seq: number) => void;
}) {
  const { log, history, groups } = useActions();
  const { seq: selected, set: onSelect } = useMoment();
  const { entries, since } = history;
  const { joined, shown, scale } = useScale();
  const earlier = nearestChange(log, entries, selected, -1);
  const later = nearestChange(log, entries, selected, 1);
  const { pos, drawn } = drawer({
    log,
    scale,
    joined,
    since,
    selected,
    onSelect,
  });
  const at = selected === null ? undefined : scale.x.get(selected);

  // a step that removes (Live) or turns off (an end reached) the button
  // pressed hands focus to one still there, so it doesn't fall to the page
  const bar = useRef<HTMLDivElement>(null);
  const stepped = useRef(false);
  const step = (to: number | null) => {
    // only while the bar has it (a pointer press need not focus a button);
    // the step renders before the next frame, so this can't go stale
    if (!bar.current?.contains(document.activeElement)) return onSelect(to);
    stepped.current = true;
    requestAnimationFrame(() => (stepped.current = false));
    onSelect(to);
  };
  useLayoutEffect(() => {
    if (!stepped.current) return;
    stepped.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    bar.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
  });
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (earlier) step(earlier.seq);
        break;
      case 'ArrowRight':
        if (entry) step(later?.seq ?? null);
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
          disabled={!earlier}
          onClick={() => earlier && step(earlier.seq)}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next change"
          disabled={!entry}
          onClick={() => step(later?.seq ?? null)}
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
            title="Open action"
            onClick={() => onOpen(entry.seq)}
          >
            <ActionName entry={entry} />
          </button>
          <span className={styles.dim}> · {seconds(entry.at - since)}s</span>
        </div>
      )}
    </div>
  );
}

/** The shown store's actions on one time axis, a lane per key: requests as
 * spans from fetch to response, everything else as marks. Picking an action
 * the store saw shows State as it was right after it */
export default memo(function Timeline({
  width,
  onPick,
}: {
  /** Panel width (px) */
  width: number;
  /** Called as a mark is picked (not as the keys step) */
  onPick?: () => void;
}) {
  const { log, history, groups } = useActions();
  const { dropped } = useLog();
  const {
    seq: selected,
    set,
    lens: { spacing },
    setLens,
  } = useMoment();
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
    setLens({ spacing: fit ? 'detailed' : 'fit' });
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
    const next = nearestChange(log, entries, selected, by);
    if (next) set(next.seq);
    else if (by > 0) toLive();
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
    onSelect,
  });
  // whether a lane's own actions changed its record (what its History
  // lists), without working the History out for every lane. Unknown when
  // none did but the log dropped some of the lane's: those may have, which
  // only the History can say
  const laneChanged = (lane: Lane, id: string): boolean | undefined => {
    const entries = lane.groups.flatMap(groupEntriesOf);
    if (
      entries.some(e =>
        log.changes(e).some(c => c.id === id && isRecordChange(c)),
      )
    )
      return true;
    return droppedIn(entries, dropped) > 0 ? undefined : false;
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
      className={styles.timeline}
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
            {/* an endpoint's lane is one record's; a schema's spans a table */}
            {splitKey(lane.key).method && (
              <HistoryButton
                id={endpointId(lane.key)}
                compact
                changed={laneChanged(lane, endpointId(lane.key))}
              />
            )}
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
  const label = `${counts.join('; ')}: ${KEEPS_NEWEST}`;
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
