import clsx from 'clsx';
import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';

import {
  actionName,
  joinedFetches,
  type ActionGroup,
  type RequestGroup,
} from './actionGroups';
import { nearestChange, type LogEntry } from './actionLog';
import {
  KeyLabel,
  seconds,
  typeClass,
  useActions,
  useFollow,
} from './ActionsView';
import { NARROW_WIDTH } from './columns';
import styles from './store.module.css';

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

/** The shown store's actions on one time axis, a lane per key: requests as
 * spans from fetch to response, everything else as marks. Picking an action
 * the store saw shows State as it was right after it */
export default memo(function Timeline({
  selected,
  onSelect,
  width,
}: {
  /** The action State is shown after; `null` while live */
  selected: number | null;
  onSelect: (seq: number | null) => void;
  /** Panel width (px) */
  width: number;
}) {
  const { log, history, groups } = useActions();
  const { entries, since } = history;
  const lanes = useMemo(() => lanesOf(groups), [groups]);
  // fetches deduped into a request in flight add nothing to see
  const shown = useMemo(() => {
    const joined = new Set(groups.flatMap(g => [...joinedFetches(g).keys()]));
    return entries.filter(e => !joined.has(e));
  }, [entries, groups]);
  const scale = useMemo(() => timeScale(shown), [shown]);
  const labels = useMemo(() => axisLabels(shown, scale), [shown, scale]);
  const at = selected === null ? undefined : scale.x.get(selected);

  const scroller = useRef<HTMLDivElement>(null);
  // a picked action stays put as new ones come in
  const toNewest = useFollow(scroller, scale.width, 'x', selected !== null);
  // the picked action comes into view; back to live, the newest does, and
  // the timeline follows it again
  useLayoutEffect(() => {
    if (selected === null) return toNewest();
    scroller.current
      ?.querySelector('[data-selected]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selected, toNewest]);

  // the arrow keys step as the snapshot bar's ‹ › do; past the newest is live.
  // Live already, End still brings the newest back into view
  const toLive = () => {
    if (selected === null) toNewest();
    else onSelect(null);
  };
  const step = (by: -1 | 1) => {
    const next = nearestChange(log, entries, selected, by);
    if (next) onSelect(next.seq);
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
      case 'Escape':
        toLive();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const px = (x: number) => ({ '--tl-x': `${x}px` }) as React.CSSProperties;
  const mark = (entry: LogEntry, extra?: string) => {
    const label = `${actionName(entry.action)} at ${seconds(entry.at - since)}s`;
    const style = px(scale.x.get(entry.seq)!);
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
      style={{ ...px(from), width: Math.max(2, to - from) }}
    />
  );
  const request = (group: RequestGroup) => {
    // without the fetches deduped into it
    const own = group.entries.filter(e => scale.x.has(e.seq));
    const first = own[0];
    const to =
      group.response ? scale.x.get(group.response.seq)!
      : group.cancelled ? scale.x.get(own.at(-1)!.seq)!
      : scale.end;
    // as the list's lifecycle shows it: a fetch that changed the store
    const optimistic = log.changes(first).length > 0;
    return [
      span(scale.x.get(first.seq)!, to, styles.tlSpan, `span ${group.id}`),
      ...own.map(e =>
        mark(e, e === first && optimistic ? styles.tlOptimistic : undefined),
      ),
    ];
  };
  const drawn = (group: ActionGroup) => {
    if (group.kind === 'request') return request(group);
    if (group.kind === 'single') return [mark(group.entries[0])];
    const from = scale.x.get(group.entries[0].seq)!;
    const to =
      group.open > 0 ? scale.end : scale.x.get(group.entries.at(-1)!.seq)!;
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
      data-narrow={width < NARROW_WIDTH || undefined}
      tabIndex={0}
      role="group"
      aria-label="Timeline: arrow keys step through changes, End returns to live"
      onKeyDown={onKeyDown}
    >
      {/* the scroller stays mounted, so following starts with the first
      action */}
      {!entries.length && (
        <p className={styles.empty}>
          Nothing dispatched yet. Actions show on the timeline as the preview
          runs.
        </p>
      )}
      <div
        className={styles.tlBody}
        hidden={!entries.length}
        style={{ '--tl-width': `${scale.width}px` } as React.CSSProperties}
      >
        <div className={styles.tlAxis}>
          <span className={styles.tlLabel} />
          <span className={styles.tlTrack}>
            {labels.map(({ seq, x, at }) => (
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
});

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
