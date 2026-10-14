import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';
import useHighlight from '../useHighlight';

/** 'Custom' is the empty slot for the managers an app adds */
type Manager = 'DevTools' | 'Network' | 'Subscription' | 'Custom';

// the middleware chain, in the order getDefaultManagers() builds it
// (the chip keyframes in styles.module.css follow these and OUTSIDE's y)
const MANAGERS: { id: Manager; name?: string; y: number }[] = [
  { id: 'DevTools', name: 'DevToolsManager', y: 120 },
  { id: 'Network', name: 'NetworkManager', y: 154 },
  { id: 'Subscription', name: 'SubscriptionManager', y: 188 },
  { id: 'Custom', y: 222 },
];

// the world outside the store, and which manager talks to it
const OUTSIDE: { name: string; manager: Manager; y: number }[] = [
  { name: 'DevTools', manager: 'DevTools', y: 132 },
  { name: 'HTTP', manager: 'Network', y: 166 },
  { name: 'SSE', manager: 'Custom', y: 210 },
  { name: 'WebSockets', manager: 'Custom', y: 234 },
  { name: 'IndexedDB', manager: 'Custom', y: 258 },
];

// what each manager talks to, and its way back into the Controller
const LINKS: { manager: Manager; d: string }[] = [
  { manager: 'DevTools', d: 'M116 132H78' },
  { manager: 'Network', d: 'M116 166H78' },
  { manager: 'Custom', d: 'M116 234C94 234 100 210 78 210' },
  { manager: 'Custom', d: 'M116 234H78' },
  { manager: 'Custom', d: 'M116 234C94 234 100 258 78 258' },
  // managers dispatch through the Controller, like components do
  { manager: 'Network', d: 'M264 166H284V70' },
  { manager: 'Subscription', d: 'M264 200H284V70' },
  { manager: 'Custom', d: 'M264 234H284V70' },
];

// the actions in the animation, named as devtools shows them, and the
// managers each passes through; a read's fetch stops at NetworkManager
// (an optimistic mutation's goes on to the store, which this leaves out)
const ACTIONS: {
  type: string;
  cls: 'fetch' | 'response';
  managers: Manager[];
  w: number;
}[] = [
  {
    type: 'rdc/fetch',
    cls: 'fetch',
    managers: ['DevTools', 'Network'],
    w: 62,
  },
  {
    type: 'rdc/setresponse',
    cls: 'response',
    managers: ['DevTools', 'Network', 'Subscription', 'Custom'],
    w: 96,
  },
];

const CARDS = [
  { x: 318, y: 30 },
  { x: 309, y: 42 },
  { x: 300, y: 54 },
];

export default function DataFlow() {
  const { select, clear, highlight } = useHighlight<Manager>(
    styles.on,
    styles.off,
  );

  return (
    <svg
      className={styles.diagram}
      viewBox="0 0 440 312"
      role="img"
      onClick={clear}
      aria-label={translate({
        id: 'dataFlow.label',
        message:
          'Unidirectional data flow. Components dispatch actions through the Controller into the middleware chain of managers: DevToolsManager, NetworkManager, SubscriptionManager, then your own. Managers talk to the outside world (DevTools, HTTP, SSE, WebSockets, IndexedDB) and dispatch back through the Controller. A rdc/fetch action for a read stops at NetworkManager, which sends the request over HTTP and dispatches the response as rdc/setresponse through every manager into the store. The new state then renders in the components',
      })}
    >
      <g className={styles.managers}>
        <rect x="104" y="96" width="176" height="162" />
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text x="112" y="110">
          Managers
        </text>
      </g>

      {/* the loop: Components -> Controller -> managers -> Store -> Components */}
      <g className={styles.action}>
        <path className={styles.flow} d="M300 70H250M190 82V272" />
        <path className={styles.head} d="M250 70l7-4v8z" />
      </g>
      <g className={styles.state}>
        <path className={styles.flow} d="M250 287H330V164" />
        <path className={styles.head} d="M330 164l-4 7h8z" />
      </g>
      {LINKS.map(({ manager, d }) => (
        <path
          key={d}
          d={d}
          className={clsx(styles.flow, styles.link, highlight(manager))}
        />
      ))}

      <g className={styles.box}>
        <rect x="130" y="58" width="120" height="24" />
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text x="190" y="74">
          Controller
        </text>
      </g>

      {MANAGERS.map(({ id, name, y }) => (
        <g
          key={id}
          className={clsx(styles.manager, styles[id], highlight(id))}
          {...select(id)}
        >
          {/* pulses when it handles the action, like React DevTools' highlight */}
          <rect
            className={styles.flash}
            x="116"
            y={y}
            width="148"
            height="24"
          />
          <rect x="116" y={y} width="148" height="24" />
          <text x="190" y={y + 16}>
            {name}
          </text>
        </g>
      ))}

      {OUTSIDE.map(({ name, manager, y }) => (
        <g
          key={name}
          className={clsx(styles.outside, highlight(manager))}
          {...select(manager)}
        >
          <rect x="6" y={y - 10} width="72" height="20" />
          <text x="42" y={y + 4}>
            {name}
          </text>
        </g>
      ))}

      <g className={clsx(styles.box, styles.store)}>
        <rect
          className={styles.flash}
          x="130"
          y="272"
          width="120"
          height="30"
        />
        <rect x="130" y="272" width="120" height="30" />
        <StoreIcon
          className={styles.db}
          x="140"
          y="276"
          width="22"
          height="22"
        />
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text x="206" y="291">
          Store
        </text>
      </g>

      <g className={clsx(styles.box, styles.components)}>
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text x="357" y="20">
          Components
        </text>
        {CARDS.map(({ x, y }) => (
          <React.Fragment key={x}>
            {/* flashes when it re-renders, like React DevTools' highlight */}
            <rect
              className={styles.flash}
              x={x}
              y={y}
              width="96"
              height="110"
            />
            <rect x={x} y={y} width="96" height="110" />
          </React.Fragment>
        ))}
      </g>

      {ACTIONS.map(({ type, cls, managers, w }) => (
        <g key={type} className={clsx(styles.chip, styles[cls])}>
          {/* dims separately, since the travel animates the outer opacity */}
          <g className={highlight(...managers)}>
            <rect x={-w / 2} y="-9" width={w} height="18" />
            <text y="4">{type}</text>
          </g>
        </g>
      ))}
    </svg>
  );
}
