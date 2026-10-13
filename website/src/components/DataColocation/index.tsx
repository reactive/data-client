import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useState } from 'react';

import styles from './styles.module.css';

type Entity = 'User' | 'Post' | 'Comment';

const CHIPS: { entity: Entity; x: number; w: number }[] = [
  { entity: 'User', x: 141, w: 52 },
  { entity: 'Post', x: 201, w: 52 },
  { entity: 'Comment', x: 261, w: 56 },
];

// components that render no data, so nothing is passed through them
const PLAIN = [
  { name: 'App', cx: 220, y: 74, w: 70 },
  { name: 'Header', cx: 100, y: 122, w: 90 },
  { name: 'PostPage', cx: 322, y: 122, w: 90 },
];

const BOUND: { name: string; entity: Entity; cx: number; y: number }[] = [
  { name: 'CurrentUser', entity: 'User', cx: 100, y: 172 },
  { name: 'PostBody', entity: 'Post', cx: 262, y: 172 },
  { name: 'CommentList', entity: 'Comment', cx: 382, y: 172 },
  { name: 'Avatar', entity: 'User', cx: 262, y: 236 },
];

const TREE =
  'M220 100V111M100 111H322M100 111V122M322 111V122' +
  'M100 148V172M322 148V160M262 160H382M262 160V172M382 160V172' +
  'M262 208V236';

// from the store straight to each component that renders the data
const BINDINGS: { entity: Entity; d: string }[] = [
  { entity: 'User', d: 'M159 41V140Q159 160 140 172' },
  { entity: 'User', d: 'M175 41C175 60 179 64 179 84V240Q179 254 193 254H212' },
  {
    entity: 'Post',
    d: 'M227 41C227 62 266 56 266 80V138C266 158 292 152 292 172',
  },
  { entity: 'Comment', d: 'M289 41C289 90 400 76 400 120V172' },
];

export default function DataColocation() {
  const [active, setActive] = useState<Entity | null>(null);
  const select = (entity: Entity) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActive(entity);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActive(null);
    },
    // tap on touch screens
    onClick: () => setActive(a => (a === entity ? null : entity)),
  });
  const state = (entity: Entity) =>
    active && (active === entity ? styles.on : styles.off);

  return (
    <svg
      className={styles.diagram}
      viewBox="0 0 440 280"
      role="img"
      aria-label={translate({
        id: 'dataColocation.label',
        message:
          'Component tree where CurrentUser, PostBody, CommentList and Avatar each read their data straight from the store with useSuspense(), skipping App, Header and PostPage',
      })}
    >
      <path className={styles.tree} d={TREE} />
      {BINDINGS.map(({ entity, d }) => (
        <path
          key={d}
          d={d}
          className={clsx(styles.binding, styles[entity], state(entity))}
        />
      ))}

      <rect className={styles.store} x="107" y="10" width="226" height="40" />
      <g className={styles.db}>
        <ellipse cx="126" cy="23" rx="7" ry="3" />
        <path d="M119 23v14c0 1.7 3.1 3 7 3s7-1.3 7-3V23M119 30c0 1.7 3.1 3 7 3s7-1.3 7-3" />
      </g>
      {CHIPS.map(({ entity, x, w }) => (
        <g
          key={entity}
          className={clsx(styles.chip, styles[entity], state(entity))}
          {...select(entity)}
        >
          <rect x={x} y="19" width={w} height="22" rx="11" />
          <text x={x + w / 2} y="34">
            {entity}
          </text>
        </g>
      ))}

      {PLAIN.map(({ name, cx, y, w }) => (
        <g key={name} className={styles.plain}>
          <rect x={cx - w / 2} y={y} width={w} height="26" />
          <text x={cx} y={y + 17}>
            {name}
          </text>
        </g>
      ))}
      {BOUND.map(({ name, entity, cx, y }) => (
        <g
          key={name}
          className={clsx(styles.bound, styles[entity], state(entity))}
          {...select(entity)}
        >
          <rect x={cx - 50} y={y} width="100" height="36" />
          <text x={cx} y={y + 15}>
            {name}
          </text>
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.hook} x={cx} y={y + 28}>
            useSuspense()
          </text>
        </g>
      ))}
    </svg>
  );
}
