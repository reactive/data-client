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
 * or around each component that reads data
 */
const LEVELS = ['app', 'page', 'component'] as const;
type Level = (typeof LEVELS)[number];

/** The PostPage route's subtree: what a boundary around the route wraps */
const PAGE = [
  'PostPage',
  'Article',
  'Share',
  'CommentList',
  'Avatar',
  'PostBody',
];
/** Opening a post mounts these, so they suspend; CurrentUser already has its data */
const LOADERS = BOUND.filter(({ name }) => name !== 'CurrentUser');
/** The last data to arrive (see the arrival times in styles.module.css) */
const SLOWEST: Entity = 'Comment';

type Point = [number, number];

/** One boundary: its outline, its tag, and the spinner of its fallback */
interface Region {
  d: string;
  /** the `<AsyncBoundary>` tag, at the outline's top-left corner */
  tag: Point;
  spinner: Point;
  r: number;
  /** the data its fallback waits for */
  wait: Entity;
  /** the pointer target: its box in the SVG, clipped to the outline's shape */
  hit: { x: number; y: number; w: number; h: number; points?: Point[] };
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

/** Everything under the store */
const APP = box(2, 58, 436, 190);
/**
 * PostPage, then Article and CommentList, then Avatar, PostBody and Share:
 * stepped so it leaves out CurrentUser on the left and Footer's children on
 * the right
 */
const ROUTE: Point[] = [
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
];

const REGIONS: Record<Level, Region[]> = {
  app: [
    {
      d: rounded(APP, 12),
      tag: [12, 61.5],
      spinner: [220, 152],
      r: 9,
      wait: SLOWEST,
      hit: { x: 0, y: 54, w: WIDTH, h: HEIGHT - 54 },
    },
  ],
  page: [
    {
      d: rounded(ROUTE, 8),
      tag: [266, 103.5],
      spinner: [273, 172],
      r: 9,
      wait: SLOWEST,
      hit: { x: 128, y: 100, w: 264, h: 146, points: ROUTE },
    },
  ],
  // the component's own box is the boundary
  component: LOADERS.map(({ entity, cx, y }) => ({
    d: rounded(box(cx - 46, y, 92, 34), 7),
    tag: [cx - 40, y + 1],
    spinner: [cx, y + 17],
    r: 6,
    wait: entity,
    hit: { x: cx - 50, y: y - 4, w: 100, h: 42 },
  })),
};

/** The data a component inside the boundary waits for, if it is inside */
function waits(level: Level, name: string): Entity | undefined {
  switch (level) {
    case 'app':
      return SLOWEST;
    case 'page':
      return PAGE.includes(name) ? SLOWEST : undefined;
    case 'component':
      return LOADERS.find(c => c.name === name)?.entity;
  }
}

export default function AsyncBoundaries() {
  const [level, setLevel] = useState<Level>('page');
  // the position pointed at or focused, previewed as an outline
  const [preview, setPreview] = useState<Level | null>(null);
  const boundary = useFramework() === 'vue' ? 'Suspense' : 'AsyncBoundary';

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
      message: 'around each component that reads data',
      description:
        'Where the boundary goes, on the async boundaries diagram; completes "<AsyncBoundary> around each component that reads data"',
    }),
  };
  const ghost = (name: string) => {
    const wait = waits(level, name);
    return wait && [styles.anim, styles.ghost, styles[`wait${wait}`]];
  };
  const target = (l: Level) => ({
    'aria-pressed': l === level,
    'aria-label': `<${boundary}> ${where[l]}`,
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setPreview(l);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setPreview(null);
    },
    onFocus: () => setPreview(l),
    onBlur: () => setPreview(null),
    onClick: () => setLevel(l),
  });
  const pct = ({ x, y, w, h, points }: Region['hit']) => ({
    left: `${(x / WIDTH) * 100}%`,
    top: `${(y / HEIGHT) * 100}%`,
    width: `${(w / WIDTH) * 100}%`,
    height: `${(h / HEIGHT) * 100}%`,
    clipPath:
      points &&
      `polygon(${points
        .map(([px, py]) => `${((px - x) / w) * 100}% ${((py - y) / h) * 100}%`)
        .join(', ')})`,
  });

  return (
    <div className={styles.stage}>
      <svg
        className={styles.diagram}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={translate(
          {
            id: 'asyncBoundaries.label',
            message:
              'The component tree under its store, with one {boundary} {where}. Opening a post mounts Avatar, PostBody and CommentList, which suspend until their data arrives: everything inside the boundary shows its loading fallback until the last of them does, while the rest of the page keeps rendering. The higher the boundary, the fewer loading indicators and the more of the page they replace; one around each component shows three that resolve one by one',
            description:
              'Accessible label of the async boundaries diagram on the Render Data page; {boundary} is AsyncBoundary or Suspense, {where} one of the asyncBoundaries.app/page/component strings',
          },
          { boundary, where: where[level] },
        )}
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
            <g key={name} className={clsx(styles.plain, ghost(name))}>
              <rect x={cx - w / 2} y={y} width={w} height="22" />
              <text x={cx} y={y + 15}>
                {name}
              </text>
            </g>
          ))}
          {REST.map(({ cx, y }) => (
            <rect
              key={cx}
              className={clsx(styles.rest, ghost('rest'))}
              x={cx - 10}
              y={y}
              width="20"
              height="14"
            />
          ))}
          {BOUND.map(({ name, entity, cx, y }) => (
            <g
              key={name}
              className={clsx(styles.bound, styles[entity], ghost(name))}
            >
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

          {/* the fallback: a tint over what the boundary wraps, and a spinner */}
          {REGIONS[level].map(({ d, spinner: [sx, sy], r, wait }) => (
            <g
              key={d}
              className={clsx(
                styles.anim,
                styles.fallback,
                styles[`wait${wait}`],
              )}
            >
              <path className={styles.tint} d={d} />
              <circle
                className={styles.spinner}
                cx={sx}
                cy={sy}
                r={r}
                pathLength={100}
              />
            </g>
          ))}
        </g>

        {/* every position's outline: the chosen one in full, the others faint */}
        {LEVELS.map(l => (
          <g
            key={l}
            className={clsx(
              styles.boundary,
              l === 'component' && styles.leaf,
              l === level && styles.active,
              l === preview && styles.preview,
            )}
          >
            {REGIONS[l].map(({ d, tag: [tx, ty] }) => (
              <React.Fragment key={d}>
                <path className={styles.outline} d={d} />
                {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- component name */}
                <text className={styles.tag} x={tx} y={ty}>
                  {`<${boundary}>`}
                </text>
              </React.Fragment>
            ))}
          </g>
        ))}
      </svg>

      {/* the positions, as transparent buttons over the SVG: inside its role="img" they would be presentational */}
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
          REGIONS[l].map(({ d, hit }) => (
            <button
              key={d}
              type="button"
              className={styles.target}
              style={pct(hit)}
              {...target(l)}
            />
          )),
        )}
      </div>
    </div>
  );
}
