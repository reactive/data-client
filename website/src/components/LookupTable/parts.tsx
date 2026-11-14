import clsx from 'clsx';
import React, { useEffect, useState, useSyncExternalStore } from 'react';

import styles from './styles.module.css';
import { prefersReducedMotion } from '../motion';
import StoreIcon from '../Playground/StoreIcon';
import { useIntersectionObserver } from '../useIntersectionObserver';

/* What the diagrams of the store as a lookup table are drawn with: a switch
   over a stage, where a call writes into the table and reads find their data.
   styles.module.css has how each part looks and moves. */

export const WIDTH = 420;
/** The viewBox starts here, just above the call highlight's stroke */
export const TOP = 22;
/** How long what a run added takes to fade, in ms */
export const CLEAR = 400;
/** The call line's baseline */
export const CALL_Y = 40;
/** The width of a character, as a share of the monospace font's size */
export const CHAR = 0.6;
export const FONT = { text: 10.5, small: 9.5 };
/** What styles.module.css reads, so each value is written once */
const VARS = {
  '--text': `${FONT.text}px`,
  '--small': `${FONT.small}px`,
  '--clear': `${CLEAR}ms`,
} as React.CSSProperties;
/** How tall an issue is, as a row and as a pk */
export const ISSUE_H = 14;
/** An issue's pk, as a list holds it */
export const PK = { w: 22, pitch: 26 };

export type Point = [number, number];
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the table keys by, in one color wherever it appears */
export interface Keyed {
  id: string;
  /** the class that sets its color */
  hue: string;
}
/** An issue, with its title as a bar this wide */
export interface Issue extends Keyed {
  title: number;
}
export const ISSUES = {
  5: { id: '5', hue: styles.issue5, title: 56 },
  6: { id: '6', hue: styles.issue6, title: 40 },
} satisfies Record<string, Issue>;
/** The assignee a list is filtered by */
export const ASSIGNEE: Keyed = { id: '1', hue: styles.args };

/** When a part of a run starts, in ms from the run's start */
export const at = (ms: number) =>
  ({ '--at': `${ms}ms` }) as React.CSSProperties;

const onTabShown = (sync: () => void) => {
  document.addEventListener('visibilitychange', sync);
  return () => document.removeEventListener('visibilitychange', sync);
};
const isTabShown = () => !document.hidden;

/**
 * A diagram's runs: `run` counts them, and a new one starts every `period` ms
 * and on `restart()`. Nothing runs where no one can see it: `playing` is
 * whether `stage` is on screen in a shown tab.
 */
export function useRuns(period: number) {
  const [run, setRun] = useState(0);
  const [stage, entry] = useIntersectionObserver<HTMLDivElement>();
  const tabShown = useSyncExternalStore(onTabShown, isTabShown, () => true);
  const playing = !!entry?.isIntersecting && tabShown;

  useEffect(() => {
    // under reduced motion nothing moves on its own: each run rests at its outcome
    if (!playing || prefersReducedMotion()) return;
    const timeout = window.setTimeout(() => setRun(r => r + 1), period);
    return () => window.clearTimeout(timeout);
  }, [run, playing, period]);

  return { run, restart: () => setRun(r => r + 1), stage, playing };
}

/** The switch and the diagram under it */
export function Frame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={clsx(styles.frame, className)}>{children}</div>;
}

/** The segmented control that picks what the diagram shows */
export function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
  dense,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  /** more options than fit a phone's width at full size */
  dense?: boolean;
}) {
  return (
    <div
      className={clsx(styles.controls, dense && styles.dense)}
      role="group"
      aria-label={label}
    >
      {options.map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/** The diagram, `height` tall. `runs` is what useRuns() returned */
export function Stage({
  runs: { stage, playing },
  height,
  label,
  children,
}: {
  runs: Pick<ReturnType<typeof useRuns>, 'stage' | 'playing'>;
  height: number;
  /** what it shows, for screen readers */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={stage}
      className={styles.stage}
      data-paused={playing ? undefined : true}
    >
      <svg
        className={styles.diagram}
        style={VARS}
        viewBox={`0 ${TOP} ${WIDTH} ${height - TOP}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

/**
 * What one run adds, which fades from `clearAt` so the next starts clean.
 * Render it only while playing, keyed by the run: then each run starts over,
 * so a chosen option plays right away, and so does one that comes back into
 * view.
 */
export function Run({
  clearAt,
  children,
}: {
  clearAt: number;
  children: React.ReactNode;
}) {
  return (
    <g className={clsx(styles.anim, styles.clear)} style={at(clearAt)}>
      {children}
    </g>
  );
}

/** A read finding its data: its children come out from under the table. They
 * start when the group they are in does */
export function Show({ children }: { children: React.ReactNode }) {
  return <g className={clsx(styles.anim, styles.show)}>{children}</g>;
}

/** The table's box */
export function Store({ x, y, w, h }: Box) {
  return (
    <>
      <rect className={styles.store} x={x} y={y} width={w} height={h} />
      <StoreIcon
        className={styles.db}
        x={x + 9}
        y={y + h / 2 - 9}
        width="18"
        height="18"
      />
    </>
  );
}

/** A highlight around a box: the call going out, or a read re-rendering.
 * Without `at`, it starts when the group it is in does */
export function Flash({ x, y, w, h, at: ms }: Box & { at?: number }) {
  return (
    <rect
      className={clsx(styles.anim, styles.flash)}
      style={ms === undefined ? undefined : at(ms)}
      x={x}
      y={y}
      width={w}
      height={h}
    />
  );
}

/** A line `w` long from x, through text, drawn from its start */
export function Strike({
  x,
  y,
  w,
  at: ms,
}: {
  x: number;
  y: number;
  w: number;
  at: number;
}) {
  return (
    <path
      className={clsx(styles.anim, styles.skip)}
      style={at(ms)}
      pathLength="1"
      d={`M${x} ${y}h${w}`}
    />
  );
}

/** The request or message that brings data, over the table */
export function Call({ children }: { children: React.ReactNode }) {
  return (
    <text className={styles.call} x={WIDTH / 2} y={CALL_Y}>
      {children}
    </text>
  );
}
/** The call going out: a highlight around its `chars` characters */
export function CallFlash({ chars }: { chars: number }) {
  const w = chars * CHAR * FONT.text + 24;
  return <Flash at={0} x={WIDTH / 2 - w / 2} y={CALL_Y - 12} w={w} h={18} />;
}

/** One entry of the table: its row, and the key it is stored under */
export function Entry({
  x,
  y,
  w,
  h,
  keyX,
  lands,
  children,
}: Box & {
  /** where its key ends: keys are right-aligned */
  keyX: number;
  /** when this run stores it, so it shows as its value arrives */
  lands?: number;
  children: React.ReactNode;
}) {
  const landing = lands !== undefined;
  return (
    <g
      className={clsx(styles.entry, landing && clsx(styles.anim, styles.land))}
      style={landing ? at(lands) : undefined}
    >
      <rect x={x} y={y} width={w} height={h} />
      <text x={keyX} y={y + 14}>
        {children}
      </text>
    </g>
  );
}

/** Puts its children at `to`. With `from`, they travel there, leaving at `at` */
export function Place({
  to,
  from,
  at: ms = 0,
  children,
}: {
  to: Point;
  from?: Point;
  at?: number;
  children: React.ReactNode;
}) {
  if (!from)
    return <g transform={`translate(${to[0]} ${to[1]})`}>{children}</g>;
  return (
    <g
      className={clsx(styles.anim, styles.arrive)}
      style={
        {
          ...at(ms),
          '--x0': `${from[0]}px`,
          '--y0': `${from[1]}px`,
          '--x1': `${to[0]}px`,
          '--y1': `${to[1]}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </g>
  );
}

/** An issue as an app draws it: its state and title. Drawn at the origin */
export function IssueRow({
  issue: { hue, title },
  w,
  closed,
}: {
  issue: Issue;
  w: number;
  closed?: boolean;
}) {
  return (
    <g className={clsx(styles.issue, hue, closed && styles.closed)}>
      <rect width={w} height={ISSUE_H} />
      <circle className={styles.state} cx="9" cy="7" r="4" />
      {closed && <path d="M7 7.2l1.6 1.6 2.8-3.4" />}
      <rect
        className={styles.title}
        x="19"
        y="5"
        // a narrow row cuts its title short
        width={Math.min(title, w - 24)}
        height="4"
      />
    </g>
  );
}

/** An issue's pk, as a list holds it. Drawn at the origin */
export function Pk({ issue: { id, hue } }: { issue: Issue }) {
  return (
    <g className={clsx(styles.pk, hue)}>
      <rect width={PK.w} height={ISSUE_H} />
      <text x={PK.w / 2} y="10.5">
        {id}
      </text>
    </g>
  );
}

/** What reads an endpoint: where it is drawn, and what it says */
export interface Read extends Box {
  /** the line from the table to it */
  binding: string;
  /** the call that finds its data */
  label: React.ReactNode;
  /** the request a cache keyed by request makes for this read */
  request: string;
  /** whether that request is sent */
  sent?: boolean;
}

/**
 * What reads an endpoint, named by the call that finds its data. Found, it
 * renders its children and is tied to the table; until then it has nothing
 * to render.
 */
export function ReadCard({
  read: { x, y, w, h, binding, label, request, sent },
  found,
  children,
}: {
  read: Read;
  found: boolean;
  children?: React.ReactNode;
}) {
  return (
    <g className={found ? styles.found : styles.miss}>
      <path className={styles.binding} d={binding} />
      <rect x={x} y={y} width={w} height={h} />
      <text x={x + 8} y={y + 15}>
        {label}
      </text>
      <text
        className={clsx(styles.request, sent && styles.sent)}
        x={x + 8}
        y={y + h - 8}
      >
        {request}
      </text>
      {found ?
        <>
          {children}
          <g className={styles.badge}>
            <circle cx={x + w - 4} cy={y + 4} r="6.5" />
            <path d={`M${x + w - 7} ${y + 4.2}l2 2 4-4.4`} />
          </g>
        </>
      : <rect
          className={styles.skeleton}
          x={x + 8}
          y={y + h / 2 - 6}
          width={w - 16}
          height="8"
        />
      }
    </g>
  );
}

/** A read's request that isn't made, crossed out at `at` */
export function SkipRequest({
  read: { x, y, h, request },
  at: ms,
}: {
  read: Read;
  at: number;
}) {
  return (
    <Strike
      x={x + 5}
      y={y + h - 11}
      w={request.length * CHAR * FONT.small + 6}
      at={ms}
    />
  );
}

/* eslint-disable @docusaurus/no-untranslated-text -- keys and API names */

/** A value the table keys by, in its color: in the call, as the entry's key,
 * and in the args of the read that finds it */
export function Key({ of: { id, hue } }: { of: Keyed }) {
  return <tspan className={clsx(styles.key, hue)}>{id}</tspan>;
}

/** `Issue 5`: the key an Entity is stored under */
export function IssueKey({ issue }: { issue: Issue }) {
  return (
    <>
      {'Issue '}
      <Key of={issue} />
    </>
  );
}

/** `{ assigneeId: 1 }`: the args a list is stored under, and found by.
 * `{ }` for the list of every issue */
export function ListArgs({ assignee }: { assignee?: Keyed }) {
  if (!assignee) return <>{'{ }'}</>;
  return (
    <>
      {'{ assigneeId: '}
      <Key of={assignee} />
      {' }'}
    </>
  );
}

/** `get({ id: 5 })`: the read of one issue */
export function Get({ issue }: { issue: Issue }) {
  return (
    <>
      {'get({ id: '}
      <Key of={issue} />
      {' })'}
    </>
  );
}

/** `getList({ assigneeId: 1 })`: the read of a list */
export function GetList({ assignee }: { assignee?: Keyed }) {
  return (
    <>
      {'getList('}
      {assignee && <ListArgs assignee={assignee} />}
      {')'}
    </>
  );
}
