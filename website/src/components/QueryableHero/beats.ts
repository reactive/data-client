/* The script both apps play: three clicks, and what each cache does with
   them. index.tsx draws it; styles.module.css has how it looks and moves. */

import { CLEAR } from '../LookupTable/parts';

/** How long a request takes, in ms, the same in both apps: a list takes
 * longest, then a write of one issue, then a read of one */
export function latency(request: Request) {
  if (!request.includes('/issues/')) return 1000;
  return request.startsWith('GET') ? 250 : 500;
}
/** The pointer's trip to what it clicks next */
export const TRAVEL = 600;
/** A beat starts this long before its pointer leaves */
const LEAD = 100;
/** When the requests are counted */
const TALLY = 7700;
/** One run; then it starts over */
export const PERIOD = 10000;

/** The two apps: a cache keyed by request, and Data Client */
export const SIDES = ['keyed', 'client'] as const;
export type Side = (typeof SIDES)[number];
/** What an app draws from its data, each a read of its own */
export type View = 'detail' | 'list' | 'counts';
/** What the pointer clicks: an issue's row, the detail's button, the header's */
export type Target = 'row' | 'close' | 'new';

export interface Issue {
  id: number;
  title: string;
  closed?: boolean;
}
/** The server's data: as loaded, then after each click */
export interface World {
  /** my issues, in the list's order */
  rows: Issue[];
  /** open issues: mine, and everyone's */
  mine: number;
  all: number;
  /** the issue its click opens, or changes */
  open?: Issue;
}

const search = { id: 3, title: 'Search ignores accents' };
const avatar = { id: 4, title: 'Avatar upload fails' };
const csv = { id: 5, title: 'CSV export drops a column' };
const csvClosed = { ...csv, closed: true };
const darkMode = { id: 6, title: 'Dark mode flickers' };
export const WORLDS: World[] = [
  { rows: [search, avatar, csv], mine: 3, all: 5 },
  // issue 5 is opened
  { rows: [search, avatar, csv], mine: 3, all: 5, open: csv },
  // then closed
  { rows: [search, avatar, csvClosed], mine: 2, all: 4, open: csvClosed },
  // then issue 6 is created, and opens
  {
    rows: [search, avatar, csvClosed, darkMode],
    mine: 3,
    all: 5,
    open: darkMode,
  },
];
/** The most rows a list holds: each app keeps room for them */
export const ROWS = Math.max(...WORLDS.map(world => world.rows.length));

export type Request = `${'GET' | 'PUT' | 'POST'} ${string}`;
/** One thing a cache does with a click. A beat's steps run in order: each
 * starts as the one before lands */
interface Step {
  /** the requests it sends, together. With none, it lands at once */
  sends?: Request[];
  /** what its views show until it lands: `loading` has no data to show,
   * `stale` keeps the old data on screen */
  waits?: Partial<Record<View, Wait>>;
  /** the views it re-renders as it lands, which then show the beat's world */
  lands?: View[];
  /** it re-renders its views as it sends, before its response lands */
  optimistic?: boolean;
}
export type Wait = 'loading' | 'stale';
interface Beat {
  id: 'open' | 'close' | 'create';
  /** when it is clicked, in ms from the run's start */
  at: number;
  target: Target;
  keyed: Step[];
  client: Step[];
}

const MINE: Request = 'GET /issues?assigneeId=1';
const ALL: Request = 'GET /issues';
/**
 * The three clicks. Both apps get each one at the same moment, and every
 * request takes its latency().
 *
 * The cache keyed by request is set up well: the detail on screen is
 * written from the mutation's own response (the closed issue, the new one),
 * the lists are refetched together, and they keep their old rows meanwhile.
 * Data Client reads every view from one table, and its mutations are
 * optimistic, so a click re-renders every view it changes at once.
 */
export const BEATS: Beat[] = [
  {
    id: 'open',
    at: 700,
    target: 'row',
    keyed: [
      {
        sends: ['GET /issues/5'],
        waits: { detail: 'loading' },
        lands: ['detail'],
      },
    ],
    // the list already stored Issue 5
    client: [{ lands: ['detail'] }],
  },
  {
    id: 'close',
    at: 2400,
    target: 'close',
    keyed: [
      { sends: ['PUT /issues/5'], lands: ['detail'] },
      {
        sends: [MINE, ALL],
        waits: { list: 'stale', counts: 'stale' },
        lands: ['list', 'counts'],
      },
    ],
    client: [
      {
        sends: ['PUT /issues/5'],
        lands: ['detail', 'list', 'counts'],
        optimistic: true,
      },
    ],
  },
  {
    id: 'create',
    at: 5200,
    target: 'new',
    keyed: [
      { sends: ['POST /issues'], lands: ['detail'] },
      {
        sends: [MINE, ALL],
        waits: { list: 'stale', counts: 'stale' },
        lands: ['list', 'counts'],
      },
    ],
    client: [
      {
        sends: ['POST /issues'],
        lands: ['detail', 'list', 'counts'],
        optimistic: true,
      },
    ],
  },
];

/** Every request an app sends over a run, in order */
export const REQUESTS = Object.fromEntries(
  SIDES.map(side => [
    side,
    BEATS.flatMap(beat => beat[side].flatMap(step => step.sends ?? [])),
  ]),
) as Record<Side, Request[]>;

/** One app at one moment */
export interface AppState {
  /** the world each view shows */
  shows: Record<View, number>;
  waits: Partial<Record<View, Wait>>;
  /** the world whose issue is open. It leads the detail while that loads */
  route: number;
  /** how many of its REQUESTS are sent, and how many of those are back */
  sent: number;
  landed: number;
  /** what was clicked, while its mutation is out */
  busy?: Target;
  /** the frame each view last re-rendered at */
  rendered: Partial<Record<View, number>>;
}
/** Both apps at one moment, which holds until the next frame's */
export interface Frame {
  at: number;
  /** the beat playing, as an index of BEATS */
  beat: number;
  /** where the pointer is, or is heading */
  pointer?: Target;
  /** how many clicks so far */
  clicks: number;
  /** the requests are counted */
  tally: boolean;
  /** the run is fading out */
  clearing: boolean;
  apps: Record<Side, AppState>;
}

type Change<T> = { at: number; change: (state: T, frame: number) => T };

/** What an app does over a run, as changes to its state */
function appChanges(side: Side) {
  const changes: Change<AppState>[] = [];
  BEATS.forEach((beat, i) => {
    const world = i + 1;
    let at = beat.at;
    for (const step of beat[side]) {
      const { sends = [], waits = {}, lands = [], optimistic } = step;
      const mutates = sends.some(request => !request.startsWith('GET'));
      /** shows the beat's world in the views it lands */
      const render = (state: AppState, frame: number): AppState => ({
        ...state,
        waits: {},
        route: lands.includes('detail') ? world : state.route,
        shows: {
          ...state.shows,
          ...Object.fromEntries(lands.map(view => [view, world])),
        },
        rendered: {
          ...state.rendered,
          ...Object.fromEntries(lands.map(view => [view, frame])),
        },
      });
      changes.push({
        at,
        change: (state, frame) =>
          optimistic ?
            { ...render(state, frame), sent: state.sent + sends.length }
          : {
              ...state,
              waits,
              route: waits.detail === 'loading' ? world : state.route,
              sent: state.sent + sends.length,
              busy: mutates ? beat.target : undefined,
            },
      });
      if (sends.length) at += Math.max(...sends.map(latency));
      changes.push({
        at,
        change: (state, frame) => ({
          ...(optimistic ? state : render(state, frame)),
          landed: state.sent,
          busy: undefined,
        }),
      });
    }
  });
  return changes;
}

type Stage = Omit<Frame, 'at' | 'apps'>;
/** What the pointer, the beats and the tally do over a run */
const stageChanges: Change<Stage>[] = [
  ...BEATS.flatMap((beat, i): Change<Stage>[] => [
    // the first beat starts with the run
    {
      at: i ? beat.at - TRAVEL - LEAD : 0,
      change: stage => ({ ...stage, beat: i }),
    },
    {
      at: beat.at - TRAVEL,
      change: stage => ({ ...stage, pointer: beat.target }),
    },
    { at: beat.at, change: stage => ({ ...stage, clicks: i + 1 }) },
  ]),
  { at: TALLY, change: stage => ({ ...stage, tally: true }) },
  { at: PERIOD - CLEAR, change: stage => ({ ...stage, clearing: true }) },
];

function compile(): Frame[] {
  const changes = {
    stage: stageChanges,
    keyed: appChanges('keyed'),
    client: appChanges('client'),
  };
  const times = [
    ...new Set(
      Object.values(changes).flatMap(list => list.map(change => change.at)),
    ),
  ].sort((a, b) => a - b);
  const start: AppState = {
    shows: { detail: 0, list: 0, counts: 0 },
    waits: {},
    route: 0,
    sent: 0,
    landed: 0,
    rendered: {},
  };
  let stage: Stage = { beat: 0, clicks: 0, tally: false, clearing: false };
  const apps = { keyed: start, client: start };
  return times.map((at, frame) => {
    const apply = <T>(state: T, list: Change<T>[]) =>
      list
        .filter(change => change.at === at)
        .reduce((next, { change }) => change(next, frame), state);
    stage = apply(stage, changes.stage);
    for (const side of SIDES) apps[side] = apply(apps[side], changes[side]);
    return { at, ...stage, apps: { ...apps } };
  });
}

/** A run, as every moment something changes */
export const FRAMES = compile();
/** The frame a run rests at: every request counted, nothing fading */
export const END = FRAMES.findIndex(frame => frame.tally);
/** The frame each beat starts at, and the one it has settled by */
export const SPANS = BEATS.map((_, i) => {
  const next = FRAMES.findIndex(frame => frame.beat === i + 1);
  return {
    from: FRAMES.findIndex(frame => frame.beat === i),
    to: next === -1 ? END : next - 1,
  };
});
