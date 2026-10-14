import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useState } from 'react';

import styles from './styles.module.css';
import {
  BINDINGS,
  BOUND,
  CHIPS,
  PLAIN,
  REST,
  TREE,
  type Entity,
} from '../DataColocation';
import StoreIcon from '../Playground/StoreIcon';
import useFramework from '../useFramework';

/** DataColocation's tree, drawn in the same box */
const WIDTH = 440;
const HEIGHT = 250;

/**
 * Where the boundary goes: around the whole app, around the PostPage route,
 * or around each component that loads
 */
const LEVELS = ['app', 'page', 'component'] as const;
type Level = (typeof LEVELS)[number];

/** Opening a post mounts these, so they suspend; CurrentUser already has its data */
const LOADERS = BOUND.filter(({ name }) => name !== 'CurrentUser');
/** The last data to arrive (see the arrival times in styles.module.css) */
const SLOWEST: Entity = 'Comment';

type Point = [number, number];

/** One boundary: its outline, its tag, and the spinner of its fallback */
interface Region {
  /** the outline's corners, in order */
  points: Point[];
  /** how far the corners are rounded */
  corner: number;
  /** the `<AsyncBoundary>` tag, at the outline's top-left corner */
  tag: Point;
  spinner: { cx: number; cy: number; r: number };
  /** the data its fallback waits for */
  wait: Entity;
}

/** `r` along the edge from one corner toward the next */
function toward([x, y]: Point, [tx, ty]: Point, r: number) {
  const len = Math.hypot(tx - x, ty - y);
  return `${x + ((tx - x) / len) * r} ${y + ((ty - y) / len) * r}`;
}
/** A closed path through `points`, each corner rounded by `r` */
function rounded(points: Point[], r: number) {
  const n = points.length;
  const corners = points.map((p, i) => {
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    return `${i ? 'L' : 'M'}${toward(p, prev, r)}Q${p[0]} ${p[1]} ${toward(p, next, r)}`;
  });
  return corners.join('') + 'Z';
}
const box = (x: number, y: number, w: number, h: number): Point[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/**
 * The pointer target: the outline plus a tab for its tag, which sits on the
 * top edge (`points[0]` to `points[1]`) and mostly above it, so a click on
 * the tag picks its own position, not the one behind
 */
function hit([start, ...rest]: Point[], [tx, ty]: Point, tag: string) {
  const top = start[1];
  // monospace glyphs are about 0.6em wide
  const end = tx + tag.length * 5.4 + 2;
  const points: Point[] = [
    start,
    [tx - 2, top],
    [tx - 2, ty - 8],
    [end, ty - 8],
    [end, top],
    ...rest,
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const w = Math.max(...xs) - x;
  const h = Math.max(...ys) - y;
  return {
    left: `${(x / WIDTH) * 100}%`,
    top: `${(y / HEIGHT) * 100}%`,
    width: `${(w / WIDTH) * 100}%`,
    height: `${(h / HEIGHT) * 100}%`,
    // the outline's shape, so a tap just outside it goes to the position behind
    clipPath: `polygon(${points
      .map(([px, py]) => `${((px - x) / w) * 100}% ${((py - y) / h) * 100}%`)
      .join(', ')})`,
  };
}

const REGIONS: Record<Level, Region[]> = {
  app: [
    {
      // everything under the store
      points: box(2, 58, 436, 190),
      corner: 12,
      tag: [12, 61.5],
      spinner: { cx: 220, cy: 152, r: 9 },
      wait: SLOWEST,
    },
  ],
  page: [
    {
      // PostPage, then Article and CommentList, then Avatar, PostBody and
      // Share: stepped so it leaves out CurrentUser on the left and Footer's
      // children on the right
      points: [
        [258, 100],
        [342, 100],
        [342, 143],
        [372, 143],
        [372, 200],
        [392, 200],
        [392, 246],
        [128, 246],
        [128, 200],
        [174, 200],
        [174, 143],
        [258, 143],
      ],
      corner: 8,
      tag: [266, 103.5],
      spinner: { cx: 273, cy: 172, r: 9 },
      wait: SLOWEST,
    },
  ],
  // the component's own box is the boundary
  component: LOADERS.map(({ entity, cx, y }) => ({
    points: box(cx - 46, y, 92, 34),
    corner: 7,
    tag: [cx - 40, y + 1],
    spinner: { cx, cy: y + 17, r: 6 },
    wait: entity,
  })),
};

export default function AsyncBoundaries() {
  const [level, setLevel] = useState<Level>('page');
  // the position pointed at, and the one focused: previewed as an outline,
  // the pointer's while it is over one (the route's focus ring is clipped
  // to its outline, so the outline is its focus cue)
  const [hovered, setHovered] = useState<Level | null>(null);
  const [focused, setFocused] = useState<Level | null>(null);
  const preview = hovered ?? focused;
  const vue = useFramework() === 'vue';
  const boundary = vue ? 'Suspense' : 'AsyncBoundary';
  // a Vue <Suspense> that has resolved stays resolved when components deeper
  // inside it suspend: each stays blank, with no fallback, until its own data
  // arrives. The app's resolved on first load, before the post opened
  const blank = vue && level === 'app';

  const where: Record<Level, string> = {
    app: translate({
      id: 'asyncBoundaries.app',
      message: 'around the whole app',
      description:
        'Where the boundary goes, on the async boundaries diagram; completes "<AsyncBoundary> around the whole app"',
    }),
    page: translate({
      id: 'asyncBoundaries.page',
      message: 'around the PostPage route',
      description:
        'Where the boundary goes, on the async boundaries diagram; completes "<AsyncBoundary> around the PostPage route"',
    }),
    component: translate({
      id: 'asyncBoundaries.component',
      message: 'around each component that loads',
      description:
        'Where the boundary goes, on the async boundaries diagram; completes "<AsyncBoundary> around each component that loads"',
    }),
  };
  const target = (l: Level) => ({
    'aria-pressed': l === level,
    'aria-label': `<${boundary}> ${where[l]}`,
    onPointerEnter: () => setHovered(l),
    onPointerLeave: () => setHovered(null),
    // only keyboard focus: a click's would outlast the click, outlining a
    // position next to the one chosen
    onFocus: (e: React.FocusEvent<HTMLButtonElement>) =>
      setFocused(e.currentTarget.matches(':focus-visible') ? l : null),
    onBlur: () => setFocused(null),
    onClick: () => setLevel(l),
  });

  return (
    <div className={styles.stage}>
      <svg
        className={styles.diagram}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          blank ?
            translate({
              id: 'asyncBoundaries.labelVueApp',
              message:
                'The component tree under its store, with one Suspense around the whole app. It resolved when the app first loaded, so opening a post does not bring back its fallback: Avatar, PostBody and CommentList stay blank, with no loading indicator, each until its own data arrives',
              description:
                'Accessible label of the async boundaries diagram on the Vue Render Data page, when the Suspense is around the whole app',
            })
          : translate(
              {
                id: 'asyncBoundaries.label',
                message:
                  'The component tree under its store, with one {boundary} {where}. Opening a post mounts Avatar, PostBody and CommentList, which suspend until their data arrives: everything inside the boundary shows its loading fallback until the last of them does, while the rest of the page keeps rendering. The higher the boundary, the fewer loading indicators and the more of the page they replace; one around each component shows three that resolve one by one',
                description:
                  'Accessible label of the async boundaries diagram on the Render Data page; {boundary} is AsyncBoundary or Suspense, {where} one of the asyncBoundaries.app/page/component strings',
              },
              { boundary, where: where[level] },
            )
        }
      >
        {/* each run starts over, so a moved boundary shows its loading right away */}
        <g key={level}>
          <path className={styles.tree} d={TREE} />
          {BINDINGS.map(({ entity, d }) => (
            <path
              key={d}
              d={d}
              className={clsx(styles.binding, styles[entity])}
            />
          ))}

          <rect
            className={styles.store}
            x="107"
            y="10"
            width="226"
            height="40"
          />
          <StoreIcon
            className={styles.db}
            x="115"
            y="19"
            width="22"
            height="22"
          />
          {CHIPS.map(({ entity, x, w }) => (
            <g key={entity} className={clsx(styles.chip, styles[entity])}>
              {/* pulses when the entity's data arrives */}
              <rect
                className={styles.flash}
                x={x}
                y="19"
                width={w}
                height="22"
              />
              <rect x={x} y="19" width={w} height="22" />
              <text x={x + w / 2} y="34">
                {entity}
              </text>
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
          {BOUND.map(({ name, entity, cx, y }) => (
            <g key={name} className={clsx(styles.bound, styles[entity])}>
              <rect x={cx - 46} y={y} width="92" height="34" />
              <text x={cx} y={y + 14}>
                {name}
              </text>
              {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
              <text className={styles.hook} x={cx} y={y + 27}>
                useSuspense()
              </text>
            </g>
          ))}

          {/* the fallback, in place of what the boundary wraps: a surface and a spinner
              (or, under a resolved Vue Suspense, just the blank components) */}
          {REGIONS[blank ? 'component' : level].map(
            ({ points, corner, spinner, wait }) => (
              <g
                key={points.join()}
                className={clsx(
                  styles.anim,
                  styles.fallback,
                  styles[`wait${wait}`],
                )}
              >
                <path className={styles.tint} d={rounded(points, corner)} />
                {!blank && (
                  <circle
                    className={styles.spinner}
                    {...spinner}
                    pathLength={100}
                  />
                )}
              </g>
            ),
          )}
        </g>

        {/* every position's outline: the chosen one in full, the others faint */}
        {LEVELS.map(l => (
          <g
            key={l}
            className={clsx(
              l === 'component' && styles.leaf,
              l === level && styles.active,
              l === preview && styles.preview,
            )}
          >
            {REGIONS[l].map(({ points, corner, tag: [tx, ty] }) => (
              <React.Fragment key={points.join()}>
                <path className={styles.outline} d={rounded(points, corner)} />
                <text className={styles.tag} x={tx} y={ty}>
                  {`<${boundary}>`}
                </text>
              </React.Fragment>
            ))}
          </g>
        ))}
      </svg>

      {/* the positions, as transparent buttons over the SVG: inside its role="img"
          they would be presentational. The component level is one choice, so its
          first button is the one tab stop; the others are only for the pointer */}
      <div
        className={styles.targets}
        role="group"
        aria-label={translate({
          id: 'asyncBoundaries.where',
          message: 'Where the boundary goes',
          description:
            'Label of the group of positions the boundary can be moved to on the async boundaries diagram',
        })}
      >
        {LEVELS.map(l =>
          REGIONS[l].map(({ points, tag }, i) => (
            <button
              key={points.join()}
              type="button"
              className={styles.target}
              style={hit(points, tag, `<${boundary}>`)}
              {...target(l)}
              {...(i > 0 && {
                tabIndex: -1,
                'aria-hidden': true,
                // a click would focus it, outside the accessibility tree; it
                // still lets go of the focus, like a click on the page, so none
                // stays behind on the position it moved from
                onMouseDown: (e: React.MouseEvent) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement | null)?.blur();
                },
              })}
            />
          )),
        )}
      </div>
    </div>
  );
}
