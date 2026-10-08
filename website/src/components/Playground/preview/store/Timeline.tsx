import clsx from 'clsx';
import React, { useLayoutEffect, useMemo, useRef } from 'react';

import {
  actionName,
  groupEntries,
  joinedFetches,
  type ActionGroup,
  type RequestGroup,
} from './actionGroups';
import type { LogEntry } from './actionLog';
import { KeyLabel, typeClass } from './ActionsView';
import styles from './store.module.css';

/** Pixels per millisecond between two actions */
const PX_PER_MS = 0.08;
/** Closest two actions get (px), so a burst stays apart */
const MIN_GAP = 10;
/** Farthest two actions get (px): an idle stretch shows as a break */
const MAX_GAP = 56;
/** Space before the first action and after the last (px) */
const PAD = 12;
/** Closest two axis labels get (px) */
const LABEL_GAP = 64;
/** Distance from the right end (px) that still counts as following */
const FOLLOW_SLACK = 24;

/** Where each action sits along the timeline */
export interface TimeScale {
  /** By seq: px from the start */
  readonly x: ReadonlyMap<number, number>;
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
  return { x, width: pos + PAD, breaks };
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

/** Every action on one time axis, a lane per key: requests as spans from
 * fetch to response, everything else as marks. Picking an action that left
 * the store in a new state shows State as it was right after it */
export default function Timeline({
  entries,
  storeFrom,
  since,
  selected,
  onSelect,
  narrow,
}: {
  entries: readonly LogEntry[];
  /** See `History` */
  storeFrom?: number;
  /** When the first action was dispatched */
  since: number;
  /** The action State is shown after; `null` while live */
  selected: number | null;
  onSelect: (seq: number | null) => void;
  /** A phone-width panel: shorter labels */
  narrow?: boolean;
}) {
  const lanes = useMemo(
    () => lanesOf(groupEntries(entries, storeFrom)),
    [entries, storeFrom],
  );
  // fetches deduped into a request in flight add nothing to see
  const shown = useMemo(() => {
    const joined = new Set<LogEntry>();
    for (const { groups } of lanes)
      for (const group of groups)
        for (const entry of joinedFetches(group).keys()) joined.add(entry);
    return entries.filter(e => !joined.has(e));
  }, [entries, lanes]);
  const scale = useMemo(() => timeScale(shown), [shown]);
  // what picking and the arrow keys step through
  const points = useMemo(() => shown.filter(e => e.store), [shown]);
  const at = selected === null ? undefined : scale.x.get(selected);

  const scroller = useRef<HTMLDivElement>(null);
  useFollowEnd(scroller, scale.width, selected === null);
  useLayoutEffect(() => {
    if (selected === null) return;
    scroller.current
      ?.querySelector('[data-selected]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selected]);

  if (!entries.length)
    return (
      <p className={styles.empty}>
        Nothing dispatched yet. Actions show on the timeline as the preview
        runs.
      </p>
    );

  const step = (by: -1 | 1) => {
    const i = points.findIndex(e => e.seq === selected);
    const next =
      i < 0 ?
        by < 0 ?
          points.at(-1)
        : undefined
      : points[i + by];
    if (next) onSelect(next.seq);
    else if (by > 0) onSelect(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const handle = {
      ArrowLeft: () => step(-1),
      ArrowRight: () => step(1),
      Home: () => points[0] && onSelect(points[0].seq),
      End: () => onSelect(null),
      Escape: () => onSelect(null),
    }[e.key];
    if (!handle) return;
    e.preventDefault();
    handle();
  };
  const px = (x: number) => ({ '--tl-x': `${x}px` }) as React.CSSProperties;
  const mark = (entry: LogEntry, extra?: string) => {
    const label = `${actionName(entry.action)} at ${seconds(entry.at - since)}s`;
    const className = clsx(styles.tlMark, typeClass(entry), extra);
    // only an action the store saw has a state to show
    return entry.store ?
        <button
          key={entry.seq}
          type="button"
          tabIndex={-1}
          className={className}
          style={px(scale.x.get(entry.seq)!)}
          title={label}
          aria-label={label}
          data-selected={entry.seq === selected || undefined}
          onClick={() => onSelect(entry.seq)}
        />
      : <span
          key={entry.seq}
          className={clsx(className, styles.tlHollow)}
          style={px(scale.x.get(entry.seq)!)}
          title={label}
        />;
  };
  const end = scale.width - PAD;
  const span = (from: number, to: number, className: string, key: string) => (
    <span
      key={key}
      className={className}
      style={{ ...px(from), width: Math.max(2, to - from) }}
    />
  );
  const request = (group: RequestGroup) => {
    const own = group.entries.filter(e => scale.x.has(e.seq));
    const from = scale.x.get(own[0].seq)!;
    const to =
      group.response ? scale.x.get(group.response.seq)!
      : group.cancelled ? scale.x.get(own.at(-1)!.seq)!
      : end;
    return [
      span(from, to, styles.tlSpan, `span ${group.id}`),
      ...own.map(e =>
        mark(e, e === own[0] && e.store ? styles.tlOptimistic : undefined),
      ),
    ];
  };
  const drawn = (group: ActionGroup) => {
    if (group.kind === 'request') return request(group);
    if (group.kind === 'single') return [mark(group.entries[0])];
    const from = scale.x.get(group.entries[0].seq)!;
    const to = group.open > 0 ? end : scale.x.get(group.entries.at(-1)!.seq)!;
    return [
      span(from, to, styles.tlSubscription, `span ${group.id}`),
      ...group.entries.map(e => mark(e)),
      ...group.requests.flatMap(request),
    ];
  };

  return (
    <div
      ref={scroller}
      className={styles.timeline}
      data-narrow={narrow || undefined}
      tabIndex={0}
      role="group"
      aria-label="Timeline: arrow keys step through actions, End returns to live"
      onKeyDown={onKeyDown}
    >
      <div
        className={styles.tlBody}
        style={{ '--tl-width': `${scale.width}px` } as React.CSSProperties}
      >
        <div className={styles.tlAxis}>
          <span className={styles.tlLabel} />
          <span className={styles.tlTrack}>
            {axisLabels(shown, scale).map(({ seq, x, at }) => (
              <span key={seq} className={styles.tlTime} style={px(x)}>
                {seconds(at - since)}s
              </span>
            ))}
          </span>
        </div>
        {lanes.map(lane => (
          <div key={lane.key} className={styles.tlLane}>
            <span className={styles.tlLabel}>
              {lane.key ?
                <KeyLabel value={lane.key} />
              : <span className={styles.dim}>store</span>}
            </span>
            <span className={styles.tlTrack}>{lane.groups.flatMap(drawn)}</span>
          </div>
        ))}
        {scale.breaks.map(x => (
          <span key={x} className={styles.tlBreak} style={px(x)} />
        ))}
        {at !== undefined && (
          <span className={styles.tlPlayhead} style={px(at)} />
        )}
      </div>
    </div>
  );
}

/** Entries to label on the axis, at least `LABEL_GAP` apart */
function axisLabels(entries: readonly LogEntry[], scale: TimeScale) {
  const labels: { seq: number; x: number; at: number }[] = [];
  for (const { seq, at } of entries) {
    const x = scale.x.get(seq)!;
    if (!labels.length || x - labels.at(-1)!.x >= LABEL_GAP)
      labels.push({ seq, x, at });
  }
  return labels;
}

const seconds = (ms: number) => {
  const s = ms / 1000;
  return s < 10 ? s.toFixed(2) : s.toFixed(1);
};

/** Keeps the newest end in view while `live`, unless the reader scrolled
 * back */
function useFollowEnd(
  scroller: React.RefObject<HTMLElement | null>,
  width: number,
  live: boolean,
) {
  const follow = useRef(true);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      if (!el.clientWidth) return;
      follow.current =
        el.scrollWidth - el.scrollLeft - el.clientWidth < FOLLOW_SLACK;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scroller]);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && live && follow.current) el.scrollLeft = el.scrollWidth;
  }, [scroller, width, live]);
}
