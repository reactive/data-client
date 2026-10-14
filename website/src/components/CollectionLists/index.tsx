import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useState } from 'react';

import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';

const WIDTH = 420;
const HEIGHT = 226;
/** Seconds one run of the chosen operation takes (the CSS animations' duration) */
const PERIOD = 5;

const OPS = ['push', 'unshift', 'remove', 'move'] as const;
type Op = (typeof OPS)[number];
type User = '1' | '2';

// the segmented control, drawn in the SVG with the real buttons over it
const TAB_WIDTHS: Record<Op, number> = {
  push: 44,
  unshift: 60,
  remove: 58,
  move: 44,
};
const TABS_WIDTH = Object.values(TAB_WIDTHS).reduce((a, b) => a + b);
const TABS = { x: (WIDTH - TABS_WIDTH) / 2, y: 2, h: 18 };
const TAB_X = Object.fromEntries(
  OPS.map((op, i) => [
    op,
    TABS.x + OPS.slice(0, i).reduce((x, o) => x + TAB_WIDTHS[o], 0),
  ]),
) as Record<Op, number>;
/** The buttons reach above and below the drawn tabs, so a finger can hit them */
const HIT = { y: -6, h: 32 };

/** The call line's baseline */
const CALL_Y = 40;

// the cached lists in the store, one per set of arguments getTodos was called with
const CARD = { y: 80, w: 124, h: 132 };
const CARD_X = [14, 148, 282];
const ROW = { x: 6, y: 24, w: 112, h: 14, pitch: 20 };
const BAR_WIDTHS = [52, 38, 60, 44];

interface List {
  /** what this list's pk is made of: the arguments it was fetched with */
  key: Record<string, string>;
  /** the todos already in it, by the user they belong to */
  rows: User[];
}
const LISTS: List[] = [
  { key: { userId: '1' }, rows: ['1', '1'] },
  { key: { userId: '2' }, rows: ['2', '2'] },
  { key: {}, rows: ['1', '2', '1', '2'] },
];

/** The todo each operation creates, removes or moves */
const TODO = { id: '9', userId: '1' as User };
/** Each operation's arguments: path/search params, then the body */
const CALLS: Record<Op, [Record<string, string>, Record<string, string>]> = {
  push: [{ userId: TODO.userId }, { title: "'…'" }],
  unshift: [{ userId: TODO.userId }, { title: "'…'" }],
  remove: [{ userId: TODO.userId }, { id: TODO.id }],
  move: [{ id: TODO.id }, { userId: '2' }],
};

/**
 * Collection's default createCollectionFilter: a list gets the operation when
 * every member of its key appears in the call's params or body
 */
function matches(key: Record<string, string>, args: Record<string, string>[]) {
  return Object.entries(key).every(
    ([k, value]) => `${args[0][k]}` === value || `${args[1]?.[k]}` === value,
  );
}

/** A copy of the todo's chip: where it starts and ends up during a run */
interface Chip {
  user: User;
  /** in from the call, out of the list, from one list to another, or kept */
  motion: 'arrive' | 'leave' | 'travel' | 'stay';
  from: [number, number];
  to: [number, number];
  /** the user it belongs to after the run, when that changes */
  becomes?: User;
}

function slot(list: number, index: number): [number, number] {
  return [CARD_X[list] + ROW.x, CARD.y + ROW.y + ROW.pitch * index];
}

/** Everything a run of one operation shows, from the real filter rule */
function scene(op: Op) {
  const args = CALLS[op];
  const match = LISTS.map(list => matches(list.key, args));
  // where the todo already sits: at the end of the lists its values match
  const existing = LISTS.map(list => matches(list.key, [TODO]));
  const fromCall: [number, number] = [WIDTH / 2 - ROW.w / 2, CALL_Y + 6];
  const chips: Chip[] = [];
  LISTS.forEach((list, i) => {
    const end = slot(i, list.rows.length);
    const { userId: user } = TODO;
    switch (op) {
      case 'push':
        if (match[i])
          chips.push({ user, motion: 'arrive', from: fromCall, to: end });
        break;
      case 'unshift':
        if (match[i])
          chips.push({
            user,
            motion: 'arrive',
            from: fromCall,
            to: slot(i, 0),
          });
        break;
      case 'remove':
        if (existing[i] && match[i])
          chips.push({ user, motion: 'leave', from: end, to: end });
        break;
      case 'move': {
        const becomes = args[1].userId as User;
        if (existing[i] && !match[i]) {
          // out of this list, to the end of the list its new values match
          const dest = LISTS.findIndex((_, j) => match[j] && !existing[j]);
          const to = slot(dest, LISTS[dest].rows.length);
          chips.push({ user, motion: 'travel', from: end, to, becomes });
        } else if (existing[i] && match[i]) {
          chips.push({ user, motion: 'stay', from: end, to: end, becomes });
        }
        break;
      }
    }
  });
  return { match, chips, shifts: op === 'unshift' ? match : [] };
}

export default function CollectionLists() {
  const [op, setOp] = useState<Op>('push');
  const { match, chips, shifts } = scene(op);
  const [params, body] = CALLS[op];

  return (
    <div className={styles.frame}>
      <div className={styles.stage}>
        <svg
          className={styles.diagram}
          style={{ '--period': `${PERIOD}s` } as React.CSSProperties}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={translate({
            id: 'collectionLists.label',
            message:
              'Three lists cached in the store from getTodos({ userId: 1 }), getTodos({ userId: 2 }) and getTodos(). A todo with userId 1 that push or unshift creates joins the userId 1 list and the unfiltered list, at the end or the start, and never the userId 2 list, because a list gets an item only when every argument it was fetched with appears in the call. remove takes it out of the same lists; move takes it out of the userId 1 list and into the userId 2 list, and the unfiltered list keeps it',
            description:
              'Accessible label of the collection lists diagram on the Collection page',
          })}
        >
          {/* eslint-disable @docusaurus/no-untranslated-text -- API names and arguments */}
          <g className={styles.tabs}>
            <rect
              x={TABS.x}
              y={TABS.y}
              width={TABS_WIDTH}
              height={TABS.h}
              rx="9"
            />
            {OPS.map(o => (
              <g
                key={o}
                className={clsx(styles.tab, o === op && styles.active)}
              >
                <rect
                  x={TAB_X[o] + 1}
                  y={TABS.y + 1}
                  width={TAB_WIDTHS[o] - 2}
                  height={TABS.h - 2}
                  rx="8"
                />
                <text x={TAB_X[o] + TAB_WIDTHS[o] / 2} y={TABS.y + 12.5}>
                  {o}
                </text>
              </g>
            ))}
          </g>

          {/* each run starts over, so a chosen operation plays right away */}
          <g key={op}>
            {/* the call: the operation, then its params and body */}
            <g className={styles.call}>
              <rect
                className={clsx(styles.anim, styles.flash)}
                x={WIDTH / 2 - 172}
                y={CALL_Y - 12}
                width="344"
                height="18"
              />
              <text x={WIDTH / 2} y={CALL_Y}>
                {'ctrl.fetch(getTodos.'}
                <tspan className={styles.op}>{op}</tspan>
                {', '}
                <Args value={params} />
                {', '}
                <Args value={body} />
                {')'}
              </text>
            </g>

            <rect
              className={styles.store}
              x="6"
              y="52"
              width={WIDTH - 12}
              height="168"
            />
            <StoreIcon
              className={styles.db}
              x="15"
              y="59"
              width="16"
              height="16"
            />
            <text className={styles.endpoint} x="36" y="71">
              getTodos
            </text>

            {LISTS.map((list, i) => (
              <g
                key={i}
                className={clsx(
                  styles.anim,
                  styles.card,
                  match[i] ? styles.match : styles.miss,
                )}
              >
                <rect x={CARD_X[i]} y={CARD.y} width={CARD.w} height={CARD.h} />
                <text x={CARD_X[i] + CARD.w / 2} y={CARD.y + 16}>
                  <Args value={list.key} />
                </text>
                {/* whether this list's arguments match the call */}
                <g
                  transform={`translate(${CARD_X[i] + CARD.w - 11} ${CARD.y + 11})`}
                >
                  {/* its animation scales it, so the group outside places it */}
                  <g className={clsx(styles.anim, styles.badge)}>
                    <circle r="6.5" />
                    <path
                      d={
                        match[i] ? 'M-3 0.2l2 2 4-4.4' : (
                          'M-2.4 -2.4l4.8 4.8M2.4 -2.4l-4.8 4.8'
                        )
                      }
                    />
                  </g>
                </g>
                <g
                  className={clsx(
                    styles.anim,
                    styles.rows,
                    shifts[i] && styles.shifted,
                  )}
                >
                  {list.rows.map((user, j) => {
                    const [x, y] = slot(i, j);
                    return (
                      <g key={j} className={styles[`user${user}`]}>
                        <rect
                          className={styles.row}
                          x={x}
                          y={y}
                          width={ROW.w}
                          height={ROW.h}
                        />
                        <rect
                          className={styles.bar}
                          x={x + 8}
                          y={y + 5}
                          width={BAR_WIDTHS[j]}
                          height="4"
                        />
                      </g>
                    );
                  })}
                </g>
              </g>
            ))}

            {chips.map((chip, i) => (
              <g
                key={i}
                className={clsx(styles.anim, styles.chip, styles[chip.motion])}
                style={
                  {
                    '--x0': `${chip.from[0]}px`,
                    '--y0': `${chip.from[1]}px`,
                    '--x1': `${chip.to[0]}px`,
                    '--y1': `${chip.to[1]}px`,
                  } as React.CSSProperties
                }
              >
                <Todo
                  user={chip.user}
                  className={chip.becomes && clsx(styles.anim, styles.was)}
                />
                {chip.becomes && (
                  <Todo
                    user={chip.becomes}
                    className={clsx(styles.anim, styles.becomes)}
                  />
                )}
              </g>
            ))}
          </g>
          {/* eslint-enable @docusaurus/no-untranslated-text */}
        </svg>
        <Tabs op={op} onChange={setOp} />
      </div>
    </div>
  );
}

/** `{ userId: 1 }`, with the values in their user's color */
function Args({ value }: { value: Record<string, string> }) {
  const entries = Object.entries(value);
  if (!entries.length) return <>{'{ }'}</>;
  return (
    <>
      {'{ '}
      {entries.map(([k, v], i) => (
        <React.Fragment key={k}>
          {i > 0 && ', '}
          {`${k}: `}
          <tspan className={k === 'userId' ? styles[`user${v}`] : undefined}>
            {v}
          </tspan>
        </React.Fragment>
      ))}
      {' }'}
    </>
  );
}

/** The todo the operation creates, removes or moves, drawn at the origin */
function Todo({ user, className }: { user: User; className?: string }) {
  return (
    <g className={clsx(styles[`user${user}`], className)}>
      <rect width={ROW.w} height={ROW.h} />
      <text x={ROW.w / 2} y="10.5">
        {`userId: ${user}`}
      </text>
    </g>
  );
}
/** The real buttons over the drawn tabs. The SVG is an image, so these stay HTML. */
function Tabs({ op, onChange }: { op: Op; onChange: (op: Op) => void }) {
  return (
    <div
      className={styles.controls}
      role="group"
      aria-label={translate({
        id: 'collectionLists.operation',
        message: 'Operation',
        description:
          'Label of the push / unshift / remove / move switch on the collection lists diagram',
      })}
      style={
        {
          left: `${(TABS.x / WIDTH) * 100}%`,
          top: `${(HIT.y / HEIGHT) * 100}%`,
          width: `${(TABS_WIDTH / WIDTH) * 100}%`,
          height: `${(HIT.h / HEIGHT) * 100}%`,
          // where the drawn tab sits inside each button, for its focus ring
          '--tab-top': `${((TABS.y - HIT.y) / HIT.h) * 100}%`,
          '--tab-bottom': `${((HIT.y + HIT.h - TABS.y - TABS.h) / HIT.h) * 100}%`,
        } as React.CSSProperties
      }
    >
      {OPS.map(o => (
        <button
          key={o}
          type="button"
          aria-pressed={o === op}
          aria-label={o}
          style={{ flex: TAB_WIDTHS[o] }}
          onClick={() => onChange(o)}
        />
      ))}
    </div>
  );
}
