import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useState } from 'react';

import StoreIcon from '../Playground/StoreIcon';
import styles from './styles.module.css';

type Entity = 'User' | 'Post' | 'Comment';

const CHIPS: { entity: Entity; x: number; w: number }[] = [
  { entity: 'User', x: 141, w: 52 },
  { entity: 'Post', x: 201, w: 52 },
  { entity: 'Comment', x: 261, w: 56 },
];

// components that render no data, so they never re-render for it
const PLAIN = [
  { name: 'App', cx: 104, y: 66, w: 56 },
  { name: 'Header', cx: 60, y: 106, w: 64 },
  { name: 'PostPage', cx: 300, y: 106, w: 72 },
  { name: 'Footer', cx: 400, y: 106, w: 56 },
  { name: 'Nav', cx: 30, y: 148, w: 48 },
  { name: 'Share', cx: 280, y: 206, w: 52 },
  { name: 'Form', cx: 346, y: 206, w: 52 },
];
// the rest of the app, which is usually most of it
const REST = [
  { cx: 18, y: 188 },
  { cx: 42, y: 188 },
  { cx: 386, y: 150 },
  { cx: 418, y: 150 },
];

const BOUND: { name: string; entity: Entity; cx: number; y: number }[] = [
  { name: 'CurrentUser', entity: 'User', cx: 110, y: 148 },
  { name: 'PostBody', entity: 'Post', cx: 220, y: 148 },
  { name: 'CommentList', entity: 'Comment', cx: 322, y: 148 },
  { name: 'Avatar', entity: 'User', cx: 200, y: 206 },
];

const TREE =
  'M104 88V97M60 97H400M60 97V106M300 97V106M400 97V106' +
  'M60 128V138M30 138H110M30 138V148M110 138V148' +
  'M300 128V138M220 138H322M220 138V148M322 138V148' +
  'M400 128V139M386 139H418M386 139V150M418 139V150' +
  'M30 170V180M18 180H42M18 180V188M42 180V188' +
  'M220 182V194M200 194H280M200 194V206M280 194V206' +
  'M322 182V194H346V206';

// from the store straight to each component that renders the data
const BINDINGS: { entity: Entity; d: string }[] = [
  { entity: 'User', d: 'M159 41C159 100 138 100 138 148' },
  {
    entity: 'User',
    d: 'M177 41C177 70 165 75 165 100V190C165 200 172 200 172 206',
  },
  { entity: 'Post', d: 'M227 41C227 100 245 100 245 148' },
  { entity: 'Comment', d: 'M289 41C289 80 350 70 350 100V148' },
];

export default function DataColocation() {
  const [active, setActive] = useState<Entity | null>(null);
  const select = (entity: Entity) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(entity);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(null);
    },
    // tap on touch screens; tapping the background clears it
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setActive(entity);
    },
  });
  const state = (entity: Entity) =>
    active && (active === entity ? styles.on : styles.off);

  return (
    <svg
      className={styles.diagram}
      viewBox="0 0 440 250"
      role="img"
      onClick={() => setActive(null)}
      aria-label={translate({
        id: 'dataColocation.label',
        message:
          'Component tree where only CurrentUser, PostBody, CommentList and Avatar read data straight from the store with useSuspense(), so a change re-renders just them and none of the rest of the tree',
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
      <StoreIcon className={styles.db} x="115" y="19" width="22" height="22" />
      {CHIPS.map(({ entity, x, w }) => (
        <g
          key={entity}
          className={clsx(styles.chip, styles[entity], state(entity))}
          {...select(entity)}
        >
          {/* pulses when the entity changes */}
          <rect className={styles.flash} x={x} y="19" width={w} height="22" />
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
        <g
          key={name}
          className={clsx(styles.bound, styles[entity], state(entity))}
          {...select(entity)}
        >
          {/* flashes when it re-renders, like React DevTools' highlight */}
          <rect
            className={styles.flash}
            x={cx - 46}
            y={y}
            width="92"
            height="34"
          />
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
    </svg>
  );
}
