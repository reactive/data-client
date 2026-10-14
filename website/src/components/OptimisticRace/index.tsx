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
 * When each event happens, as a share of the sweep. styles.module.css keys
 * its keyframes to the same moments (each × 90%), so change them together.
 */
const AT = {
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
type Event = keyof typeof AT;
const x = (at: number) => X0 + at * SPAN;

/** Each request: out to the server and back */
const REQUESTS = [
  { c: styles.req1, send: AT.send1, srv: AT.srv1, back: AT.back1, count: 1 },
  { c: styles.req2, send: AT.send2, srv: AT.srv2, back: AT.back2, count: 2 },
];

interface Step {
  at: number;
  value: number;
  /** what changed the count; `start` is the count the row begins with */
  kind: 'start' | 'optimistic' | 'response';
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
      { at: 0, value: 0, kind: 'start' },
      { at: AT.back2, value: 2, kind: 'response' },
      { at: AT.back1, value: 1, kind: 'response' },
    ],
  },
  {
    key: 'naive',
    base: 190,
    steps: [
      { at: 0, value: 0, kind: 'start' },
      { at: AT.send1, value: 1, kind: 'optimistic' },
      { at: AT.send2, value: 2, kind: 'optimistic' },
      { at: AT.back2, value: 2, kind: 'response' },
      { at: AT.back1, value: 1, kind: 'response' },
    ],
  },
  {
    key: 'client',
    base: 230,
    steps: [
      { at: 0, value: 0, kind: 'start' },
      { at: AT.send1, value: 1, kind: 'optimistic' },
      { at: AT.send2, value: 2, kind: 'optimistic' },
    ],
  },
];
/** The step chart's rise per count */
const STEP = 10;
const PILL = { w: 16, h: 14 };
/** The count display beside each row's label */
const SCREEN = { x: 84, w: 28, h: 24 };

/** Which keyframe shows an element from the moment it happens */
const appear = (at: number) => {
  const event = (Object.keys(AT) as Event[]).find(k => AT[k] === at);
  return event && clsx(styles.anim, styles[event]);
};

/**
 * Two increments of a counter race: the second response comes back before
 * the first. A playhead sweeps the timeline; under the requests, three step
 * charts and live counters show what each library displays along the way.
 * Hovering (or a tap, on touch screens) holds the moment under the pointer.
 */
export default function OptimisticRace() {
  // the moment held under the pointer, as a share of the sweep; `run`
  // restarts the animations, so a hold starts them paused at 0 and a
  // negative delay then seeks them (see styles.module.css)
  const [hold, setHold] = useState<{ at: number | null; run: number }>({
    at: null,
    run: 0,
  });
  const svg = useRef<SVGSVGElement>(null);
  /** a tap holds until the next tap; dragging scrubs meanwhile */
  const tap = useRef<{ x: number; pinned: boolean } | null>(null);
  const pinned = useRef(false);

  const seek = (e: React.PointerEvent) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const px = ((e.clientX - box.left) / box.width) * WIDTH;
    const at = Math.min(1, Math.max(0, (px - X0) / SPAN));
    setHold(h => ({ at, run: h.at === null ? h.run + 1 : h.run }));
  };
  const release = () => {
    pinned.current = false;
    setHold(h => (h.at === null ? h : { at: null, run: h.run + 1 }));
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
          hold.at !== null ?
            ({
              '--seek': `calc(var(--period) * ${-hold.at * SWEEP})`,
              '--play': 'paused',
            } as React.CSSProperties)
          : undefined
        }
        onPointerMove={e => {
          if (!touch(e) || (pinned.current && e.buttons)) seek(e);
        }}
        onPointerLeave={e => {
          if (!touch(e)) release();
        }}
        onPointerDown={e => {
          if (!touch(e)) return;
          tap.current = { x: e.clientX, pinned: pinned.current };
          pinned.current = true;
          seek(e);
        }}
        onPointerUp={e => {
          if (!touch(e) || !tap.current) return;
          // a second tap lets go; a drag just moved the hold
          if (tap.current.pinned && Math.abs(e.clientX - tap.current.x) < 8)
            release();
          tap.current = null;
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
  const final = steps[steps.length - 1].value;
  const wrong = final !== 2;
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
                step.kind === 'optimistic' && styles.optimistic,
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
          <g className={clsx(styles.confirmed, appear(AT.back2))}>
            <circle cx={x(AT.back2) + 11} cy={y(2)} r="5.5" />
            <path d={`M${x(AT.back2) + 8} ${y(2) + 0.3}l2 2 4-4.3`} />
          </g>
          {/* the first response is older than the store's data, so it is ignored */}
          <g className={clsx(styles.pill, styles.ignored, appear(AT.back1))}>
            <rect
              x={x(AT.back1) + 3}
              y={y(2) - PILL.h / 2}
              width={PILL.w}
              height={PILL.h}
            />
            {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- the count */}
            <text x={x(AT.back1) + 3 + PILL.w / 2} y={y(2) + 3.5}>
              1
            </text>
            <path
              d={`M${x(AT.back1) + 6} ${y(2) + 4.5}L${x(AT.back1) + 16} ${y(2) - 4.5}`}
            />
          </g>
        </>
      )}

      {/* the live counter: a strip of digits, slid to the one on screen */}
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
          {[0, 1, 2].map(digit => (
            <text
              key={digit}
              x={SCREEN.w / 2}
              y={SCREEN.h / 2 + 4.5 + digit * SCREEN.h}
            >
              {digit}
            </text>
          ))}
        </g>
      </svg>
      {wrong && (
        <rect
          className={clsx(styles.screen, styles.flag, appear(AT.back1))}
          x={SCREEN.x}
          y={y(1) - SCREEN.h / 2}
          width={SCREEN.w}
          height={SCREEN.h}
        />
      )}
    </g>
  );
}
