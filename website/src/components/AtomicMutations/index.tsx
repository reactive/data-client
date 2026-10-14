import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';

const WIDTH = 440;
const HEIGHT = 262;

/** Entities in the store; the Todos change in turn, one every 2s */
type Entity = 'U1' | 'T1' | 'T2' | 'T3';
/** Components that read the store */
type Component = 'CurrentUser' | 'TodoList' | 'TodoDetail';
/** What the reader can point at */
type Target = Entity | Component;

const TODOS = ['T1', 'T2', 'T3'] as const;

const CHIPS: { entity: Entity; name: string; x: number; w: number }[] = [
  { entity: 'U1', name: 'User 1', x: 46, w: 50 },
  { entity: 'T1', name: 'Todo 1', x: 104, w: 58 },
  { entity: 'T2', name: 'Todo 2', x: 170, w: 58 },
  { entity: 'T3', name: 'Todo 3', x: 236, w: 58 },
];

// the bound components: one shows a list, one a single todo
const BOXES: Record<
  Component,
  { x: number; y: number; width: number; height: number }
> = {
  CurrentUser: { x: 52, y: 178, width: 92, height: 34 },
  TodoDetail: { x: 152, y: 178, width: 92, height: 60 },
  TodoList: { x: 252, y: 178, width: 92, height: 76 },
};

/** Which pointer targets light each part up: itself, and what it is bound to */
const LIT: Record<Target, Target[]> = {
  U1: ['U1', 'CurrentUser'],
  T1: ['T1', 'TodoList', 'TodoDetail'],
  T2: ['T2', 'TodoList'],
  T3: ['T3', 'TodoList'],
  CurrentUser: ['U1', 'CurrentUser'],
  TodoList: ['T1', 'T2', 'T3', 'TodoList'],
  TodoDetail: ['T1', 'TodoDetail'],
};
/** The request and the response are the Todos' */
const NETWORK: Target[] = ['T1', 'T2', 'T3', 'TodoList', 'TodoDetail'];

// components that render no data, so they never re-render for it
const PLAIN = [
  { name: 'App', cx: 200, y: 96, w: 56 },
  { name: 'Header', cx: 70, y: 136, w: 64 },
  { name: 'TodoPage', cx: 240, y: 136, w: 72 },
  { name: 'Nav', cx: 26, y: 178, w: 40 },
];
// the rest of the app, which is usually most of it
const REST = [
  { cx: 14, y: 218 },
  { cx: 38, y: 218 },
];

const TREE =
  'M200 118V127M70 127H240M70 127V136M240 127V136' +
  'M70 158V169M26 169H98M26 169V178M98 169V178' +
  'M240 158V169M198 169H298M198 169V178M298 169V178' +
  'M26 200V210M14 210H38M14 210V218M38 210V218';

// from each entity straight to each component that renders it
const BINDINGS: { entity: Entity; to: Component; d: string }[] = [
  { entity: 'U1', to: 'CurrentUser', d: 'M71 49C71 105 118 115 116 178' },
  { entity: 'T1', to: 'TodoDetail', d: 'M118 49C118 120 184 110 184 178' },
  { entity: 'T1', to: 'TodoList', d: 'M132 49C132 75 308 60 298 178' },
  { entity: 'T2', to: 'TodoList', d: 'M196 49C196 80 312 70 312 178' },
  { entity: 'T3', to: 'TodoList', d: 'M260 49C260 90 326 80 326 178' },
];
// the mutation: TodoList calls ctrl.fetch(), the response lands in the store
const REQUEST = 'M344 216H428V48';
const RESPONSE = 'M330 38H300';
const PILL = { x: 330, y: 28, width: 102, height: 20 };

/** A checkbox: the box, and the check that appears when the todo completes */
function Checkbox({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 10;
  const tick = `M${x + 2.5 * s} ${y + 5.2 * s}L${x + 4.3 * s} ${y + 7 * s}L${x + 7.6 * s} ${y + 3.2 * s}`;
  return (
    <>
      <rect className={styles.box} x={x} y={y} width={size} height={size} />
      <g className={styles.check}>
        <rect x={x} y={y} width={size} height={size} />
        <path d={tick} />
      </g>
    </>
  );
}

export default function AtomicMutations() {
  const [active, setActive] = useState<Target | null>(null);
  useEffect(() => {
    if (!active) return;
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [active]);

  /** on or off while something is pointed at, by what lights it */
  const state = (lit: Target[]) =>
    active && (lit.includes(active) ? styles.on : styles.off);
  const entity = (name: string) =>
    translate(
      {
        id: 'atomicMutations.entity',
        message: '{entity} in the store',
        description:
          'Label of an entity chip in the atomic mutations diagram; pointing at it highlights the components bound to it',
      },
      { entity: name },
    );
  const label: Record<Component, string> = {
    CurrentUser: translate({
      id: 'atomicMutations.currentUser',
      message: 'CurrentUser renders User 1',
      description:
        'Label of the CurrentUser component in the atomic mutations diagram; pointing at it highlights the entity it is bound to',
    }),
    TodoList: translate({
      id: 'atomicMutations.todoList',
      message: 'TodoList renders Todo 1, Todo 2 and Todo 3',
      description:
        'Label of the TodoList component in the atomic mutations diagram; pointing at it highlights the entities it is bound to',
    }),
    TodoDetail: translate({
      id: 'atomicMutations.todoDetail',
      message: 'TodoDetail renders Todo 1',
      description:
        'Label of the TodoDetail component in the atomic mutations diagram; pointing at it highlights the entity it is bound to',
    }),
  };

  // a hover on desktop, a tap on touch screens; tapping the background clears
  const target = (key: Target) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(key);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(null);
    },
    onFocus: () => setActive(key),
    onBlur: () => setActive(null),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setActive(key);
    },
  });
  const pct = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / WIDTH) * 100}%`,
    top: `${(y / HEIGHT) * 100}%`,
    width: `${(w / WIDTH) * 100}%`,
    height: `${(h / HEIGHT) * 100}%`,
  });

  return (
    <div
      className={clsx(
        styles.stage,
        // a single todo pointed at: the request shown is its own
        active && active !== 'TodoList' && styles.single,
      )}
      onClick={() => setActive(null)}
    >
      <svg
        className={styles.diagram}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={translate({
          id: 'atomicMutations.label',
          message:
            'A Todo app under its store. TodoList calls ctrl.fetch(partialUpdate), one PATCH response enters the store and changes one Todo, and the new data flows along the bindings to only the components that render that Todo: its row in TodoList and, for Todo 1, TodoDetail. CurrentUser and the rest of the tree keep the same data, and nothing is refetched',
          description:
            'Accessible label of the atomic mutations diagram on the Mutate Data page',
        })}
      >
        <path className={styles.tree} d={TREE} />
        {BINDINGS.map(({ entity: e, to, d }) => (
          <path
            key={d}
            d={d}
            className={clsx(styles.binding, styles[e], state([e, to]))}
          />
        ))}

        {/* the mutation: out of TodoList, back into the store */}
        <g className={clsx(styles.Todo, state(NETWORK))}>
          <path className={clsx(styles.binding, styles.request)} d={REQUEST} />
          <path
            className={clsx(styles.binding, styles.response)}
            d={RESPONSE}
          />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.call} x="350" y="211">
            ctrl.fetch()
          </text>
          <rect className={clsx(styles.flash, styles.pillFlash)} {...PILL} />
          <rect className={styles.pill} {...PILL} />
          {TODOS.map((todo, i) => (
            <text
              key={todo}
              className={clsx(styles.slot, styles[todo], state(LIT[todo]))}
              x={PILL.x + PILL.width / 2}
              y={PILL.y + 14}
            >
              {`PATCH /todos/${i + 1}`}
            </text>
          ))}
        </g>

        <rect className={styles.store} x="8" y="12" width="292" height="52" />
        <StoreIcon className={styles.db} x="16" y="27" width="22" height="22" />
        {CHIPS.map(({ entity: e, name, x, w }) => (
          <g key={e} className={clsx(styles.chip, styles[e], state(LIT[e]))}>
            {/* pulses when the entity changes */}
            <rect className={styles.flash} x={x} y="27" width={w} height="22" />
            <rect x={x} y="27" width={w} height="22" />
            <text x={e === 'U1' ? x + w / 2 : x + 21} y="42">
              {name}
            </text>
            {e !== 'U1' && <Checkbox x={x + w - 13} y={33.5} size={9} />}
          </g>
        ))}

        {PLAIN.map(({ name, cx, y, w }) => (
          <g key={name} className={styles.plain}>
            <rect x={cx - w / 2} y={y} width={w} height="22" />
            <text x={cx} y={y + 15}>
              {name}
            </text>
          </g>
        ))}
        {REST.map(({ cx, y }) => (
          <rect
            key={cx}
            className={styles.rest}
            x={cx - 10}
            y={y}
            width="20"
            height="14"
          />
        ))}

        {/* CurrentUser: bound to User 1, which never changes here */}
        <g className={clsx(styles.bound, styles.U1, state(LIT.CurrentUser))}>
          <rect className={styles.flash} {...BOXES.CurrentUser} />
          <rect {...BOXES.CurrentUser} />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- component name */}
          <text x="98" y="192">
            CurrentUser
          </text>
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.hook} x="98" y="205">
            useSuspense()
          </text>
        </g>

        {/* TodoDetail: bound to Todo 1 */}
        <g className={clsx(styles.bound, styles.T1, state(LIT.TodoDetail))}>
          {/* flashes when it re-renders, like React DevTools' highlight */}
          <rect
            className={clsx(styles.flash, styles.render)}
            {...BOXES.TodoDetail}
          />
          <rect {...BOXES.TodoDetail} />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- component name */}
          <text x="198" y="191">
            TodoDetail
          </text>
          <g className={styles.view}>
            <Checkbox x={164} y={199} size={12} />
            <rect
              className={styles.bar}
              x="182"
              y="202"
              width="52"
              height="6"
            />
            <rect
              className={styles.bar}
              x="164"
              y="217"
              width="58"
              height="4"
            />
          </g>
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.hook} x="198" y="233">
            useSuspense()
          </text>
        </g>

        {/* TodoList: bound to all three, a row each */}
        <g className={clsx(styles.bound, styles.Todo, state(LIT.TodoList))}>
          {TODOS.map(todo => (
            <rect
              key={todo}
              className={clsx(styles.flash, styles.render, styles[todo])}
              {...BOXES.TodoList}
            />
          ))}
          <rect {...BOXES.TodoList} />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- component name */}
          <text x="298" y="191">
            TodoList
          </text>
          {TODOS.map((todo, i) => (
            <g
              key={todo}
              className={clsx(styles.view, styles[todo], state(LIT[todo]))}
            >
              <Checkbox x={262} y={198 + i * 14} size={10} />
              <rect
                className={styles.bar}
                x="278"
                y={200.5 + i * 14}
                width={[46, 36, 52][i]}
                height="5"
              />
            </g>
          ))}
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.hook} x="298" y="249">
            useSuspense()
          </text>
        </g>
      </svg>

      {/* the pointer and keyboard targets, over the chips and components */}
      <div className={styles.targets}>
        {CHIPS.map(({ entity: e, name, x, w }) => (
          <button
            key={e}
            type="button"
            className={clsx(styles.target, styles.chipTarget)}
            style={pct(x, 27, w, 22)}
            aria-label={entity(name)}
            aria-pressed={active === e}
            {...target(e)}
          />
        ))}
        {(Object.keys(BOXES) as Component[]).map(c => (
          <button
            key={c}
            type="button"
            className={styles.target}
            style={pct(BOXES[c].x, BOXES[c].y, BOXES[c].width, BOXES[c].height)}
            aria-label={label[c]}
            aria-pressed={active === c}
            {...target(c)}
          />
        ))}
      </div>
    </div>
  );
}
