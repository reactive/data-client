/* The script both apps play: three clicks, and what each cache does with
   them. index.tsx draws it; styles.module.css has how it looks and moves. */

import { CLEAR } from '../LookupTable/parts';

/** How long a request takes, in ms, the same in both apps: a list takes
 * longest, then a write, then a read of one thing, by its id */
export function latency(request: Request) {
  if (!request.startsWith('GET')) return 500;
  return /\/\d+$/.test(request) ? 250 : 1000;
}
/** The pointer's trip to what it clicks next */
export const TRAVEL = 600;
/** How long a click's result stays on screen before the pointer leaves for
 * the next click */
const DWELL = 600;
/** A beat starts this long before its pointer leaves */
const LEAD = 100;
/** How long a finished run rests before it fades */
const REST = 2500;

/** When the apps click: each `own` its pace, as soon as its screen shows
 * the last click's result, or in `sync`, the faster app waiting for the
 * slower so both click at the same moments */
export type Pace = 'own' | 'sync';

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
  target: Target;
  keyed: Step[];
  client: Step[];
}

const MINE: Request = 'GET /issues?assigneeId=1';
const ALL: Request = 'GET /issues';
/**
 * The three clicks. Both apps get the same clicks, every request takes its
 * latency(), and schedule() says when each app clicks.
 *
 * Both apps start with the same responses loaded: the two issue lists and
 * the team, GET /users.
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
    target: 'row',
    keyed: [
      {
        sends: ['GET /issues/5'],
        waits: { detail: 'loading' },
      },
      // the issue names its assignee by id, and the detail shows their name.
      // User 1 came in GET /users, which this cache stores under that request
      {
        sends: ['GET /users/1'],
        waits: { detail: 'loading' },
        lands: ['detail'],
      },
    ],
    // the list stored Issue 5, and GET /users stored the user it is assigned to
    client: [{ lands: ['detail'] }],
  },
  {
    id: 'close',
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
    target: 'new',
    keyed: [
      // its assignee is still cached under GET /users/1, from opening issue 5
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
        lands: ['list', 'counts'],
        optimistic: true,
      },
      // the new issue's id comes in the response
      { lands: ['detail'] },
    ],
  },
];

/** Every request an app sends over `beats`, in order */
const sendsOf = (side: Side, beats: Beat[]) =>
  beats.flatMap(beat => beat[side].flatMap(step => step.sends ?? []));
/** The most requests an app sends over a whole run: each app's waterfall
 * keeps a row for them */
export const LANES = Math.max(
  ...SIDES.map(side => sendsOf(side, BEATS).length),
);
/** The longest request's length, in characters: a waterfall's names are
 * that wide where there is room */
export const LONGEST = Math.max(
  ...SIDES.flatMap(side => sendsOf(side, BEATS)).map(({ length }) => length),
);

/** A request an app sends in a run */
export interface Sent {
  request: Request;
  /** when it leaves, in ms from the run's start. It is back latency() later */
  at: number;
  /** the request whose response it waited for, as an index of the run's:
   * the slowest of its beat's step before */
  after?: number;
}

/** One app at one moment */
export interface AppState {
  /** the beat it is on, as an index of BEATS */
  beat: number;
  /** where its pointer is, or is heading */
  pointer?: Target;
  /** how many clicks so far this run */
  clicks: number;
  /** the world each view shows */
  shows: Record<View, number>;
  waits: Partial<Record<View, Wait>>;
  /** the world whose issue is open. It leads the detail while that loads */
  route: number;
  /** how many of a whole run's requests are sent, and how many of those are
   * back */
  sent: number;
  landed: number;
  /** what was clicked, while its mutation is out */
  busy?: Target;
  /** the frame each view last re-rendered at */
  rendered: Partial<Record<View, number>>;
  /** every click's result is on screen, and every response back */
  done: boolean;
}
/** Both apps at one moment, which holds until the next frame's */
export interface Frame {
  at: number;
  /** the run is fading out */
  clearing: boolean;
  apps: Record<Side, AppState>;
}
/** Some of the beats, played once */
export interface Run {
  /** every moment something changes; the first is its start */
  frames: Frame[];
  /** the frame it rests at: both apps done, nothing fading */
  end: number;
  /** from its start until the next run's, in ms */
  period: number;
  /** how long each app took, in ms */
  took: Record<Side, number>;
  /** the requests each app sends, in order */
  requests: Record<Side, Sent[]>;
  /** the time both apps' waterfalls span, in ms from the run's start: from
   * the first click to the last response */
  axis: { from: number; to: number };
  /** how long each beat is the one playing, in ms */
  spans: number[];
}

/** How long a step takes: as long as its slowest request */
const lasts = ({ sends = [] }: Step) => Math.max(0, ...sends.map(latency));

/** A beat in one app, in ms after its click: when its result is all on
 * screen, and when its last response is back */
function timing(steps: Step[]) {
  let back = 0;
  let shown = 0;
  for (const step of steps) {
    const sent = back;
    back += lasts(step);
    if (step.lands?.length) shown = step.optimistic ? sent : back;
  }
  return { shown, back };
}

/**
 * When each app clicks each of `beats`, in ms from the run's start. An app's
 * pointer leaves for its next click DWELL after its screen shows the last
 * click's result, and takes TRAVEL to get there: the same for both apps, so
 * what differs is only how long each waits for its data. In `sync`, both
 * leave when the slower is ready.
 */
function schedule(pace: Pace, beats: Beat[]) {
  const clicks: Record<Side, number[]> = { keyed: [], client: [] };
  /** when each app's pointer is free to leave */
  let free: Record<Side, number> = { keyed: LEAD, client: LEAD };
  for (const beat of beats) {
    if (pace === 'sync') {
      const both = Math.max(free.keyed, free.client);
      free = { keyed: both, client: both };
    }
    for (const side of SIDES) {
      const click = free[side] + TRAVEL;
      clicks[side].push(click);
      const { shown, back } = timing(beat[side]);
      // it never clicks while a request is out: the strip counts them back in order
      free[side] = click + Math.max(shown + DWELL, back - TRAVEL);
    }
  }
  return clicks;
}

type Change = {
  at: number;
  change: (state: AppState, frame: number) => AppState;
};

/** What an app does over `beats`, the first of them BEATS[from], clicking
 * each at its time in `clicks`: as changes to its state */
function appChanges(side: Side, from: number, beats: Beat[], clicks: number[]) {
  const changes: Change[] = [];
  const requests: Sent[] = [];
  let at = 0;
  beats.forEach((beat, i) => {
    const world = from + i + 1;
    /** the request this beat's next step waits for */
    let after: number | undefined;
    at = clicks[i];
    changes.push(
      // the first beat starts with the run
      {
        at: i ? at - TRAVEL - LEAD : 0,
        change: state => ({ ...state, beat: from + i }),
      },
      {
        at: at - TRAVEL,
        change: state => ({ ...state, pointer: beat.target }),
      },
      { at, change: state => ({ ...state, clicks: i + 1 }) },
    );
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
      const first = requests.length;
      for (const request of sends) requests.push({ request, at, after });
      if (sends.length)
        after = first + sends.findIndex(sent => latency(sent) === lasts(step));
      at += lasts(step);
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
  changes.push({ at, change: state => ({ ...state, done: true }) });
  return { changes, requests, took: at };
}

/** An app with BEATS before `from` played and settled */
function startAt(side: Side, from: number): AppState {
  const sent = sendsOf(side, BEATS.slice(0, from)).length;
  return {
    beat: from,
    pointer: BEATS[from - 1]?.target,
    clicks: 0,
    shows: { detail: from, list: from, counts: from },
    waits: {},
    route: from,
    sent,
    landed: sent,
    rendered: {},
    done: false,
  };
}

function compile(pace: Pace, from: number, count: number): Run {
  const beats = BEATS.slice(from, from + count);
  const clicks = schedule(pace, beats);
  const keyed = appChanges('keyed', from, beats, clicks.keyed);
  const client = appChanges('client', from, beats, clicks.client);
  const changes = { keyed: keyed.changes, client: client.changes };
  const took = { keyed: keyed.took, client: client.took };
  const clearAt = Math.max(took.keyed, took.client) + REST;
  const times = [
    ...new Set([
      0,
      ...SIDES.flatMap(side => changes[side].map(change => change.at)),
      clearAt,
    ]),
  ].sort((a, b) => a - b);
  const apps = {
    keyed: startAt('keyed', from),
    client: startAt('client', from),
  };
  const frames = times.map((at, frame): Frame => {
    for (const side of SIDES)
      apps[side] = changes[side]
        .filter(change => change.at === at)
        .reduce((next, { change }) => change(next, frame), apps[side]);
    return { at, clearing: at === clearAt, apps: { ...apps } };
  });
  const end = frames.findIndex(
    ({ apps }) => apps.keyed.done && apps.client.done,
  );
  /** when BEATS[beat] starts playing: the end, for one that never does */
  const starts = (beat: number) =>
    (frames.find(frame => beatOf(frame) >= beat) ?? frames[end]).at;
  return {
    frames,
    end,
    period: clearAt + CLEAR,
    took,
    requests: { keyed: keyed.requests, client: client.requests },
    axis: {
      from: Math.min(clicks.keyed[0], clicks.client[0]),
      to: Math.max(took.keyed, took.client),
    },
    spans: BEATS.map((_, i) =>
      i + 1 < from + count ?
        starts(i + 1) - starts(i)
      : frames[end].at - starts(i),
    ),
  };
}

/** The beat a frame is on: the last one both apps have reached */
export const beatOf = ({ apps }: Frame) =>
  Math.min(apps.keyed.beat, apps.client.beat);

const runs = new Map<string, Run>();
/** `count` beats from BEATS[from] on, to the last by default, with both
 * apps starting together */
export function runOf(pace: Pace, from = 0, count = BEATS.length - from) {
  const key = `${pace} ${from} ${count}`;
  let run = runs.get(key);
  if (!run) runs.set(key, (run = compile(pace, from, count)));
  return run;
}
