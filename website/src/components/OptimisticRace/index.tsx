import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';

import styles from './styles.module.css';

const WIDTH = 440;
/** The viewBox starts here, just over the client lane's chips */
const TOP = 14;
const HEIGHT = 246;

/** The time axis */
const X0 = 124;
const X1 = 426;
const SPAN = X1 - X0;
/** The share of each cycle the playhead takes to cross the axis; it then rests at the end */
const SWEEP = 0.9;

const LANE = { client: 36, server: 88 };
/**
 * When each moment happens, as a share of the sweep. styles.module.css keys
 * its keyframes to the same moments (each × 90%), so change them together.
 */
const AT = {
  start: 0,
  /** the first increment is sent, from 0 */
  send1: 0.12,
  /** the second increment is sent, from 1 */
  send2: 0.26,
  /** the server counts 1 */
  srv1: 0.36,
  /** the server counts 2 */
  srv2: 0.48,
  /** the second response, 2, reaches the client first */
  back2: 0.62,
  /** the first response, 1, reaches the client last */
  back1: 0.82,
};
type Moment = keyof typeof AT;
const x = (at: Moment) => X0 + AT[at] * SPAN;
/** Which keyframe shows an element from its moment on; the start needs none */
const appear = (at: Moment) => at !== 'start' && clsx(styles.anim, styles[at]);

/** Each request: out to the server and back */
const REQUESTS = [
  { c: styles.req1, send: 'send1', srv: 'srv1', back: 'back1', count: 1 },
  { c: styles.req2, send: 'send2', srv: 'srv2', back: 'back2', count: 2 },
] as const;

interface Step {
  at: Moment;
  value: number;
  /** set by the client before the server confirms it */
  optimistic?: boolean;
}
interface Row {
  key: 'none' | 'naive' | 'client';
  /** the step chart's baseline */
  base: number;
  steps: Step[];
}
/** What each library shows, over time */
const ROWS: Row[] = [
  {
    key: 'none',
    base: 150,
    steps: [
      { at: 'start', value: 0 },
      { at: 'back2', value: 2 },
      { at: 'back1', value: 1 },
    ],
  },
  {
    key: 'naive',
    base: 190,
    steps: [
      { at: 'start', value: 0 },
      { at: 'send1', value: 1, optimistic: true },
      { at: 'send2', value: 2, optimistic: true },
      { at: 'back2', value: 2 },
      { at: 'back1', value: 1 },
    ],
  },
  {
    key: 'client',
    base: 230,
    steps: [
      { at: 'start', value: 0 },
      { at: 'send1', value: 1, optimistic: true },
      { at: 'send2', value: 2, optimistic: true },
    ],
  },
];
/** The step chart's rise per count */
const STEP = 10;
const PILL = { w: 16, h: 14 };
/** The count display beside each row's label */
const SCREEN = { x: 84, w: 28, h: 24 };

/**
 * Two increments of a counter race: the second response comes back before
 * the first. A playhead sweeps the timeline; under the requests, three step
 * charts and live counters show what each library displays along the way.
 * Hovering (or a tap, on touch screens) holds the moment under the pointer.
 */
export default function OptimisticRace() {
  // whether a moment is held under the pointer; `run` restarts the
  // animations, so a hold starts them paused at 0 and the negative delay
  // --seek, written straight onto the svg, then seeks them (see
  // styles.module.css)
  const [hold, setHold] = useState({ held: false, run: 0 });
  const svg = useRef<SVGSVGElement>(null);
  /** the svg's box while held, so a move needs no layout */
  const box = useRef<DOMRect>(undefined);

  const seek = (e: React.PointerEvent) => {
    if (!box.current || !svg.current) return;
    const { left, width } = box.current;
    const px = ((e.clientX - left) / width) * WIDTH;
    const at = Math.min(1, Math.max(0, (px - X0) / SPAN));
    svg.current.style.setProperty(
      '--seek',
      `calc(var(--period) * ${-at * SWEEP})`,
    );
  };
  const grab = (e: React.PointerEvent) => {
    box.current = e.currentTarget.getBoundingClientRect();
    setHold(h => (h.held ? h : { held: true, run: h.run + 1 }));
    seek(e);
  };
  const release = () => {
    svg.current?.style.removeProperty('--seek');
    setHold(h => (h.held ? { held: false, run: h.run + 1 } : h));
  };
  const touch = (e: React.PointerEvent) => e.pointerType === 'touch';

  return (
    <div className={styles.frame}>
      <svg
        ref={svg}
        className={styles.diagram}
        viewBox={`0 ${TOP} ${WIDTH} ${HEIGHT - TOP}`}
        role="img"
        style={
          hold.held ?
            ({ '--play': 'paused' } as React.CSSProperties)
          : undefined
        }
        // a mouse holds the moment under it; a finger, while it drags
        onPointerMove={e => {
          if (!touch(e) || e.buttons) (hold.held ? seek : grab)(e);
        }}
        onPointerLeave={e => {
          if (!touch(e)) release();
        }}
        // a tap holds; the next one lets go
        onPointerDown={e => {
          if (touch(e)) (hold.held ? release : grab)(e);
        }}
        onPointerCancel={e => {
          if (touch(e)) release();
        }}
        aria-label={translate({
          id: 'optimisticRace.label',
          message:
            'Two increments of a counter at 0 are sent before either one answers, and the second answer, 2, reaches the client before the first, 1. Without optimistic updates a counter shows 0, then 2, then 1. With naive optimistic updates it shows 0, 1, 2, 2, then 1. Both end on the wrong value. Data Client shows 0, 1, 2 and stays at 2: the late answer is older than what the store already has, so it changes nothing',
          description:
            'Accessible label of the race condition diagram on the Optimistic Updates page',
        })}
      >
        {/* the lanes: the client on top, the server under it */}
        <path
          className={styles.lane}
          d={`M${X0} ${LANE.client}H${X1}M${X0} ${LANE.server}H${X1}`}
        />
        <text className={styles.laneLabel} x="112" y={LANE.client + 4}>
          {translate({
            id: 'optimisticRace.client',
            message: 'Client',
            description:
              'Label of the client lane in the race condition diagram: the app sending increments',
          })}
        </text>
        <text className={styles.laneLabel} x="112" y={LANE.server + 4}>
          {translate({
            id: 'optimisticRace.server',
            message: 'Server',
            description:
              'Label of the server lane in the race condition diagram: the API that counts the increments',
          })}
        </text>

        {/* each row: who is counting */}
        {ROWS.map(({ key, base }) => (
          <g key={key} className={clsx(styles.rowLabel, styles[key])}>
            <text x="76" y={base - 12}>
              {key === 'client' ?
                translate({
                  id: 'optimisticRace.dataClient',
                  message: 'Data Client',
                  description:
                    'Label of the Data Client row in the race condition diagram (the product name, usually kept)',
                })
              : translate({
                  id: 'optimisticRace.other',
                  message: 'Other',
                  description:
                    'Label of the two rows for other libraries in the race condition diagram, over "no optimistic" or "optimistic"',
                })
              }
            </text>
            <text className={styles.sub} x="76" y={base - 1}>
              {key === 'none' ?
                translate({
                  id: 'optimisticRace.noOptimistic',
                  message: 'no optimistic',
                  description:
                    'Under "Other" in the race condition diagram: this row shows a counter without optimistic updates',
                })
              : translate({
                  id: 'optimisticRace.optimistic',
                  message: 'optimistic',
                  description:
                    'Under "Other" and "Data Client" in the race condition diagram: these rows show a counter with optimistic updates',
                })
              }
            </text>
          </g>
        ))}

        {/* each run starts over, paused when a moment is held */}
        <g key={hold.run}>
          {REQUESTS.map(({ c, send, srv, back, count }) => (
            <g key={count} className={c}>
              {/* the path out and back */}
              <path
                className={styles.guide}
                d={`M${x(send)} ${LANE.client}L${x(srv)} ${LANE.server}L${x(back)} ${LANE.client}`}
              />
              {/* the increment, on its way to the server */}
              <g
                className={clsx(
                  styles.chip,
                  styles.anim,
                  styles[`out${count}`],
                )}
                style={travel(x(send), LANE.client, x(srv), LANE.server)}
              >
                <rect
                  className={styles.request}
                  x="-9"
                  y="-7"
                  width="18"
                  height="14"
                />
                {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- the increment */}
                <text y="3.5">+1</text>
              </g>
              {/* the server's count once it lands */}
              <g className={clsx(styles.chip, styles.filled, appear(srv))}>
                <rect
                  x={x(srv) - 9}
                  y={LANE.server - 7}
                  width="18"
                  height="14"
                />
                <text x={x(srv)} y={LANE.server + 3.5}>
                  {count}
                </text>
              </g>
              {/* the response, on its way back */}
              <g
                className={clsx(
                  styles.chip,
                  styles.filled,
                  styles.anim,
                  styles[`return${count}`],
                )}
                style={travel(x(srv), LANE.server, x(back), LANE.client)}
              >
                <rect x="-9" y="-7" width="18" height="14" />
                <text y="3.5">{count}</text>
              </g>
            </g>
          ))}

          {ROWS.map(row => (
            <StepChart key={row.key} row={row} />
          ))}

          <line
            className={clsx(styles.playhead, styles.anim)}
            x1={X0}
            x2={X0}
            y1={TOP + 4}
            y2={HEIGHT}
          />
        </g>
      </svg>
    </div>
  );
}

/** Where a chip travels from and to, for its keyframes */
function travel(x0: number, y0: number, x1: number, y1: number) {
  return {
    '--x0': `${x0}px`,
    '--y0': `${y0}px`,
    '--x1': `${x1}px`,
    '--y1': `${y1}px`,
  } as React.CSSProperties;
}

/**
 * What one library shows: a step chart of the count over time, each change
 * tagged with the count it set, and a live counter beside the label. A count
 * going down is the race getting the better of it, in red.
 */
function StepChart({ row: { key, base, steps } }: { row: Row }) {
  const y = (value: number) => base - value * STEP;
  // the counts it shows, in order: a response that re-sets one changes nothing
  const shown = steps
    .filter((step, i) => !i || step.value !== steps[i - 1].value)
    .map(step => step.value);
  const wrong = shown[shown.length - 1] !== 2;
  return (
    <g className={styles[key]}>
      {steps.map((step, i) => {
        const prev = steps[i - 1];
        const next = steps[i + 1];
        const bad = prev && step.value < prev.value;
        const cx = x(step.at) + 3 + PILL.w / 2;
        return (
          <g key={step.at} className={clsx(appear(step.at), bad && styles.bad)}>
            {/* the step: up (or down) to the new count, then along */}
            <path
              className={styles.step}
              d={`M${x(step.at)} ${prev ? y(prev.value) : y(step.value)}V${y(step.value)}H${next ? x(next.at) : X1}`}
            />
            <g
              className={clsx(
                styles.pill,
                step.optimistic && styles.optimistic,
                prev && step.value === prev.value && styles.again,
              )}
            >
              <rect
                x={cx - PILL.w / 2}
                y={y(step.value) - PILL.h / 2}
                width={PILL.w}
                height={PILL.h}
              />
              <text x={cx} y={y(step.value) + 3.5}>
                {step.value}
              </text>
            </g>
          </g>
        );
      })}
      {key === 'client' && (
        <>
          {/* the second response confirms the count the store already shows */}
          <g className={clsx(styles.confirmed, appear('back2'))}>
            <circle cx={x('back2') + 11} cy={y(2)} r="5.5" />
            <path d={`M${x('back2') + 8} ${y(2) + 0.3}l2 2 4-4.3`} />
          </g>
          {/* the first response is older than the store's data, so it is ignored */}
          <g className={clsx(styles.pill, styles.ignored, appear('back1'))}>
            <rect
              x={x('back1') + 3}
              y={y(2) - PILL.h / 2}
              width={PILL.w}
              height={PILL.h}
            />
            {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- the count */}
            <text x={x('back1') + 3 + PILL.w / 2} y={y(2) + 3.5}>
              1
            </text>
            <path
              d={`M${x('back1') + 6} ${y(2) + 4.5}L${x('back1') + 16} ${y(2) - 4.5}`}
            />
          </g>
        </>
      )}

      {/* the live counter: a strip of the counts it shows, slid one slot
          per change */}
      <rect
        className={styles.screen}
        x={SCREEN.x}
        y={y(1) - SCREEN.h / 2}
        width={SCREEN.w}
        height={SCREEN.h}
      />
      <svg
        className={styles.window}
        x={SCREEN.x}
        y={y(1) - SCREEN.h / 2}
        width={SCREEN.w}
        height={SCREEN.h}
        viewBox={`0 0 ${SCREEN.w} ${SCREEN.h}`}
      >
        <g className={clsx(styles.strip, styles.anim)}>
          {shown.map((value, i) => (
            <text
              key={i}
              x={SCREEN.w / 2}
              y={SCREEN.h / 2 + 4.5 + i * SCREEN.h}
            >
              {value}
            </text>
          ))}
        </g>
      </svg>
      {wrong && (
        <rect
          className={clsx(styles.screen, styles.flag, appear('back1'))}
          x={SCREEN.x}
          y={y(1) - SCREEN.h / 2}
          width={SCREEN.w}
          height={SCREEN.h}
        />
      )}
    </g>
  );
}
