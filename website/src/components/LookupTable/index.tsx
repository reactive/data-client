import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useState, useSyncExternalStore } from 'react';

import styles from './styles.module.css';
import { prefersReducedMotion } from '../motion';
import StoreIcon from '../Playground/StoreIcon';
import { useIntersectionObserver } from '../useIntersectionObserver';

const WIDTH = 420;
/** The viewBox starts here, just above the call highlight's stroke */
const TOP = 22;
const HEIGHT = 284;

/** One run, in ms; then it starts over */
const PERIOD = 7400;
/** How long what a run added takes to fade, in ms */
const CLEAR = 400;
/** When each part of a run starts, in ms. styles.module.css has how long each takes */
const AT = {
  /** the response, taken apart, leaves for the table */
  arrive: 600,
  /** a new entry shows as its value lands */
  land: 1400,
  /** the first read finds its data; each next one, `next` later */
  read: 2500,
  next: 750,
  /** its request is crossed out */
  skip: 200,
  /** the requests are counted, this long after the last read */
  tally: 1000,
  /** what the run added fades, so the next starts clean */
  clear: PERIOD - CLEAR,
};
const at = (ms: number) => ({ '--at': `${ms}ms` }) as React.CSSProperties;

/** The call line's baseline */
const CALL_Y = 40;
/** The width of a character, as a share of the monospace font's size */
const CHAR = 0.6;
const FONT = { text: 10.5, small: 9.5 };
/** What styles.module.css reads, so each value is written once */
const VARS = {
  '--text': `${FONT.text}px`,
  '--small': `${FONT.small}px`,
  '--clear': `${CLEAR}ms`,
} as React.CSSProperties;

const STORE = { x: 6, y: 52, w: 408, h: 108 };
/** One entry of the table: its key, right-aligned, then its value */
const ENTRY = { x: 42, y: 60, w: 364, h: 20, pitch: 24, key: 196, value: 208 };
const ISSUE = { w: 120, h: 14 };
/** An issue's pk, as a list holds it */
const PK = { w: 22, pitch: 26 };
/** What reads an endpoint: a page or component, and the request it would make */
const READ = { y: 178, h: 74 };
/** The first is wider: a list's label is its longest */
const READS = [
  { x: 6, w: 184 },
  { x: 198, w: 104 },
  { x: 310, w: 104 },
];

type Id = '5' | '6';
type Point = [number, number];
/** What a call does to an issue: nothing, stores it, or closes it */
type Change = 'kept' | 'new' | 'closed';
const IDS: Id[] = ['5', '6'];
/** Each issue's title, as a bar this wide */
const TITLE = { 5: 56, 6: 40 };

/** The assignee one list is filtered by */
const ASSIGNEE = '1';
/** The lists the store can hold, by the args they were fetched with */
const LISTS = {
  assignee: { entry: 2, request: `GET /issues?assigneeId=${ASSIGNEE}` },
  all: { entry: 3, request: 'GET /issues' },
};
type List = keyof typeof LISTS;

/** How data arrives. The mutation comes first: it shows the most */
const OPS = ['POST', 'GET', 'WebSocket'] as const;
type Op = (typeof OPS)[number];
/** The request or message that brings data: its text, around the value the table keys by */
const CALLS: Record<Op, [before: string, key: string, after: string]> = {
  POST: ['POST /issues { assigneeId: ', ASSIGNEE, ", title: '…' }"],
  GET: ['GET /issues?assigneeId=', ASSIGNEE, ''],
  WebSocket: ['WebSocket: { id: ', '5', ", state: 'closed' }"],
};

interface Scene {
  /** how many requests the call itself is */
  sends: number;
  issues: Record<Id, Change>;
  /** the lists in the table; each holds every issue */
  lists: List[];
  /** whether this call stores the lists, or they were there */
  newLists?: boolean;
  /** what reads the table next: a list by its args, or an issue by its pk */
  reads: (List | Id)[];
  /** whether the reads are all on screen, so they change together; otherwise
   * each is the next page opened */
  together?: boolean;
}
const SCENES: Record<Op, Scene> = {
  // getList.push({ assigneeId: 1, title }): both lists get the issue, and its detail is ready
  POST: {
    sends: 1,
    issues: { 5: 'kept', 6: 'new' },
    lists: ['assignee', 'all'],
    reads: ['assignee', 'all', '6'],
  },
  // a list's response is also each item's detail
  GET: {
    sends: 1,
    issues: { 5: 'new', 6: 'new' },
    lists: ['assignee'],
    newLists: true,
    reads: ['assignee', '5', '6'],
  },
  // a message changes the one entry every read shows, so none shows the old value
  WebSocket: {
    sends: 0,
    issues: { 5: 'closed', 6: 'kept' },
    lists: ['assignee', 'all'],
    reads: ['assignee', 'all', '5'],
    together: true,
  },
};

const entryY = (index: number) => ENTRY.y + ENTRY.pitch * index;
const isList = (read: List | Id): read is List => read in LISTS;

const onTabShown = (sync: () => void) => {
  document.addEventListener('visibilitychange', sync);
  return () => document.removeEventListener('visibilitychange', sync);
};
const isTabShown = () => !document.hidden;

/**
 * The store as one lookup table. A call above writes into it once, then each
 * read below finds its data there by args, so the request it would have made
 * is crossed out. A tally compares the requests sent with what a cache keyed by
 * request would send. The switch picks how the data arrives.
 */
export default function LookupTable() {
  // `run` restarts the animations; every change of `op` starts a new one
  const [{ op, run }, setScene] = useState({ op: OPS[0] as Op, run: 0 });
  const scene = SCENES[op];
  const [stage, entry] = useIntersectionObserver<HTMLDivElement>();
  const tabShown = useSyncExternalStore(onTabShown, isTabShown, () => true);
  // nothing runs where no one can see it
  const playing = !!entry?.isIntersecting && tabShown;

  useEffect(() => {
    // under reduced motion nothing moves on its own: each run rests at its outcome
    if (!playing || prefersReducedMotion()) return;
    const timeout = window.setTimeout(
      () => setScene(s => ({ ...s, run: s.run + 1 })),
      PERIOD,
    );
    return () => window.clearTimeout(timeout);
  }, [run, playing]);

  // what the call brings starts out under it: the issues it stores or
  // overwrites, stacked, beside the pks of those new to the lists
  const arriving = IDS.filter(id => scene.issues[id] !== 'kept');
  const stored = IDS.filter(id => scene.issues[id] === 'new');
  const x0 = WIDTH / 2 - (ISSUE.w + PK.pitch * stored.length) / 2;
  const from = (id: Id): { issue: Point; pk: Point } => ({
    issue: [x0, CALL_Y + 6 + (ISSUE.h + 3) * arriving.indexOf(id)],
    pk: [x0 + ISSUE.w + 4 + PK.pitch * stored.indexOf(id), CALL_Y + 6],
  });

  const reads = scene.reads.map((read, i) => {
    const list = isList(read);
    const ids = list ? IDS : [read];
    return {
      ...READS[i],
      read,
      ids,
      // a list is in the table once fetched; an issue, once any response held it
      found: list ? !scene.newLists : scene.issues[read] !== 'new',
      request: list ? LISTS[read].request : `GET /issues/${read}`,
      // the call above is this read's own request
      sent: list && !!scene.newLists,
      at: AT.read + (scene.together ? 0 : AT.next * i),
      rowY: (id: Id) => READ.y + (list ? 22 + 17 * ids.indexOf(id) : 28),
    };
  });
  const total = scene.sends + reads.filter(read => !read.sent).length;
  const tallyAt = reads[reads.length - 1].at + AT.tally;
  const callW = CALLS[op].join('').length * CHAR * FONT.text + 24;

  // Each part of the table is drawn twice: as it was before the call, and
  // (`after`) as what the call adds or changes, which travels in from the call

  const issueEntries = (after: boolean) =>
    IDS.map((id, i) => {
      const change = scene.issues[id];
      if (change === (after ? 'kept' : 'new')) return null;
      return (
        <React.Fragment key={id}>
          {(!after || change === 'new') && (
            <Entry index={i} lands={after}>
              <IssueKey id={id} />
            </Entry>
          )}
          {/* an issue's new fields overwrite its one entry */}
          <Place
            to={[ENTRY.value, entryY(i) + 3]}
            from={after ? from(id).issue : undefined}
          >
            <IssueRow
              id={id}
              w={ISSUE.w}
              closed={after && change === 'closed'}
            />
          </Place>
        </React.Fragment>
      );
    });

  const listEntries = (after: boolean) =>
    scene.lists.map(list => (
      <React.Fragment key={list}>
        {after === !!scene.newLists && (
          <Entry index={LISTS[list].entry} lands={after}>
            <ListArgs list={list} />
          </Entry>
        )}
        {/* a list holds pks, not copies, and every list that matches gets the new one */}
        {IDS.map(
          (id, i) =>
            (scene.issues[id] === 'new') === after && (
              <Place
                key={id}
                to={pkAt(list, i)}
                from={after ? from(id).pk : undefined}
              >
                <Pk id={id} />
              </Place>
            ),
        )}
      </React.Fragment>
    ));

  /** A read's issues that the call did one of `changes` to */
  const readRows = (
    read: (typeof reads)[number],
    changes: Change[],
    after = false,
  ) =>
    read.ids.map(
      id =>
        changes.includes(scene.issues[id]) && (
          <Place key={id} to={[read.x + 8, read.rowY(id)]}>
            <IssueRow
              id={id}
              w={read.w - 16}
              closed={after && scene.issues[id] === 'closed'}
            />
          </Place>
        ),
    );

  return (
    <div className={styles.frame}>
      <div
        className={styles.controls}
        role="group"
        aria-label={translate({
          id: 'lookupTable.transport',
          message: 'Data arrives from',
          description:
            'Label of the POST / GET / WebSocket switch on the lookup table diagram of the Queryable page',
        })}
      >
        {OPS.map(o => (
          <button
            key={o}
            type="button"
            aria-pressed={o === op}
            onClick={() => setScene({ op: o, run: run + 1 })}
          >
            {o}
          </button>
        ))}
      </div>
      <div
        ref={stage}
        className={styles.stage}
        data-paused={playing ? undefined : true}
      >
        <svg
          className={styles.diagram}
          style={VARS}
          viewBox={`0 ${TOP} ${WIDTH} ${HEIGHT - TOP}`}
          role="img"
          aria-label={translate({
            id: 'lookupTable.label',
            message:
              'The store as one lookup table: Issue 5 and Issue 6 by pk, and the lists for { assigneeId: 1 } and { } by args. POST /issues with assigneeId 1 is one request. It stores Issue 6 and adds it to both lists, so getList({ assigneeId: 1 }), getList() and get({ id: 6 }) each render it without the request they would otherwise make: 1 request, where a cache keyed by request sends 4. GET /issues?assigneeId=1 stores Issue 5, Issue 6 and their list, so get({ id: 5 }) and get({ id: 6 }) render without a request: 1 request, not 3. A websocket message that closes Issue 5 changes its one entry, so both lists and get({ id: 5 }) show it closed: 0 requests, not 3',
            description:
              'Accessible label of the lookup table diagram on the Queryable page',
          })}
        >
          <rect
            className={styles.store}
            x={STORE.x}
            y={STORE.y}
            width={STORE.w}
            height={STORE.h}
          />
          <StoreIcon
            className={styles.db}
            x="15"
            y={STORE.y + STORE.h / 2 - 9}
            width="18"
            height="18"
          />

          {/* what is there before the call: it stays put from run to run */}
          <Call op={op} />
          {issueEntries(false)}
          {listEntries(false)}
          {reads.map(read => (
            <ReadCard key={read.x} read={read} found={read.found}>
              {read.found && readRows(read, ['kept', 'closed'])}
            </ReadCard>
          ))}

          {/* what the call changes. Each run starts over, so a chosen call
              plays right away, and so does one that comes back into view */}
          {playing && (
            <g
              key={run}
              className={clsx(styles.anim, styles.clear)}
              style={at(AT.clear)}
            >
              <rect
                className={clsx(styles.anim, styles.flash)}
                style={at(0)}
                x={WIDTH / 2 - callW / 2}
                y={CALL_Y - 12}
                width={callW}
                height="18"
              />
              {issueEntries(true)}
              {listEntries(true)}

              {reads.map(read => (
                <g key={read.x} style={at(read.at)}>
                  {read.found ?
                    <>
                      {/* flashes when it re-renders, like React DevTools' highlight */}
                      <rect
                        className={clsx(styles.anim, styles.flash)}
                        x={read.x}
                        y={READ.y}
                        width={read.w}
                        height={READ.h}
                      />
                      <g className={clsx(styles.anim, styles.show)}>
                        {readRows(read, ['new', 'closed'], true)}
                      </g>
                    </>
                  : <g className={clsx(styles.anim, styles.show)}>
                      <ReadCard read={read} found>
                        {readRows(read, ['kept', 'new', 'closed'], true)}
                      </ReadCard>
                    </g>
                  }
                  {!read.sent && (
                    <path
                      className={clsx(styles.anim, styles.skip)}
                      style={at(read.at + AT.skip)}
                      pathLength="1"
                      d={strike(
                        read.x + 5,
                        READ.y + READ.h - 11,
                        read.request.length * CHAR * FONT.small + 6,
                      )}
                    />
                  )}
                </g>
              ))}

              {/* the requests sent, beside what a cache keyed by request sends */}
              <g
                className={clsx(styles.anim, styles.land, styles.tally)}
                style={at(tallyAt)}
              >
                <text className={styles.tallyLabel} x={WIDTH / 2 + 4} y="274">
                  {translate({
                    id: 'lookupTable.requests',
                    message: 'Requests',
                    description:
                      'Label of the request tally on the lookup table diagram: before a crossed-out count and the real one',
                  })}
                </text>
                <text className={styles.other} x={WIDTH / 2 + 22} y="274">
                  {total}
                </text>
                <path
                  className={clsx(styles.anim, styles.skip)}
                  style={at(tallyAt + AT.skip)}
                  pathLength="1"
                  d={strike(WIDTH / 2 + 15, 269.5, 14)}
                />
                <text className={styles.sends} x={WIDTH / 2 + 42} y="274">
                  {scene.sends}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/** Where a list's entry holds the pk of its `index`th issue */
function pkAt(list: List, index: number): Point {
  return [ENTRY.value + PK.pitch * index, entryY(LISTS[list].entry) + 3];
}
/** A line `w` long from x, through text */
function strike(x: number, y: number, w: number) {
  return `M${x} ${y}h${w}`;
}

/* eslint-disable @docusaurus/no-untranslated-text -- requests, keys and API names */

/** What the table keys by, in one color wherever it appears: in the call, as
 * the entry's key, and in the args of the read that finds it */
function Key({ value }: { value: string }) {
  const hue = value === ASSIGNEE ? styles.args : styles[`issue${value}`];
  return <tspan className={clsx(styles.key, hue)}>{value}</tspan>;
}

function Call({ op }: { op: Op }) {
  const [before, key, after] = CALLS[op];
  return (
    <text className={styles.call} x={WIDTH / 2} y={CALL_Y}>
      {before}
      <Key value={key} />
      {after}
    </text>
  );
}

/** `Issue 5`: the key an Entity is stored under */
function IssueKey({ id }: { id: Id }) {
  return (
    <>
      {'Issue '}
      <Key value={id} />
    </>
  );
}

/** `{ assigneeId: 1 }`: the args a list is stored under, and found by */
function ListArgs({ list }: { list: List }) {
  if (list === 'all') return <>{'{ }'}</>;
  return (
    <>
      {'{ assigneeId: '}
      <Key value={ASSIGNEE} />
      {' }'}
    </>
  );
}

/** One entry of the table: its row, and the key it is stored under */
function Entry({
  index,
  lands,
  children,
}: {
  index: number;
  /** stored by this call, so it shows as its value arrives */
  lands?: boolean;
  children: React.ReactNode;
}) {
  return (
    <g
      className={clsx(styles.entry, lands && clsx(styles.anim, styles.land))}
      style={lands ? at(AT.land) : undefined}
    >
      <rect x={ENTRY.x} y={entryY(index)} width={ENTRY.w} height={ENTRY.h} />
      <text x={ENTRY.key} y={entryY(index) + 14}>
        {children}
      </text>
    </g>
  );
}

/** Puts its children at `to`. With `from`, they travel there from the call */
function Place({
  to,
  from,
  children,
}: {
  to: Point;
  from?: Point;
  children: React.ReactNode;
}) {
  if (!from)
    return <g transform={`translate(${to[0]} ${to[1]})`}>{children}</g>;
  return (
    <g
      className={clsx(styles.anim, styles.arrive)}
      style={
        {
          ...at(AT.arrive),
          '--x0': `${from[0]}px`,
          '--y0': `${from[1]}px`,
          '--x1': `${to[0]}px`,
          '--y1': `${to[1]}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </g>
  );
}

/** An issue as an app draws it: its state and title. Drawn at the origin */
function IssueRow({ id, w, closed }: { id: Id; w: number; closed?: boolean }) {
  return (
    <g
      className={clsx(
        styles.issue,
        styles[`issue${id}`],
        closed && styles.closed,
      )}
    >
      <rect width={w} height={ISSUE.h} />
      <circle className={styles.state} cx="9" cy="7" r="4" />
      {closed && <path d="M7 7.2l1.6 1.6 2.8-3.4" />}
      <rect
        className={styles.title}
        x="19"
        y="5"
        width={TITLE[id]}
        height="4"
      />
    </g>
  );
}

/** An issue's pk, as a list holds it. Drawn at the origin */
function Pk({ id }: { id: Id }) {
  return (
    <g className={clsx(styles.pk, styles[`issue${id}`])}>
      <rect width={PK.w} height={ISSUE.h} />
      <text x={PK.w / 2} y="10.5">
        {id}
      </text>
    </g>
  );
}

/**
 * What reads an endpoint, named by the call that finds its data. Found, it
 * renders its children and is tied to the table; until then it has nothing
 * to render.
 */
function ReadCard({
  read: { x, w, read, request, sent },
  found,
  children,
}: {
  read: {
    x: number;
    w: number;
    read: List | Id;
    /** the request a cache keyed by request makes for this read */
    request: string;
    /** whether the call above is that request */
    sent: boolean;
  };
  found: boolean;
  children?: React.ReactNode;
}) {
  return (
    <g className={found ? styles.found : styles.miss}>
      <path
        className={styles.binding}
        d={`M${x + w / 2} ${STORE.y + STORE.h}V${READ.y}`}
      />
      <rect x={x} y={READ.y} width={w} height={READ.h} />
      <text x={x + 8} y={READ.y + 15}>
        {isList(read) ?
          <>
            {'getList('}
            {read === 'assignee' && <ListArgs list={read} />}
            {')'}
          </>
        : <>
            {'get({ id: '}
            <Key value={read} />
            {' })'}
          </>
        }
      </text>
      <text
        className={clsx(styles.request, sent && styles.sent)}
        x={x + 8}
        y={READ.y + READ.h - 8}
      >
        {request}
      </text>
      {found ?
        <>
          {children}
          <g className={styles.badge}>
            <circle cx={x + w - 4} cy={READ.y + 4} r="6.5" />
            <path d={`M${x + w - 7} ${READ.y + 4.2}l2 2 4-4.4`} />
          </g>
        </>
      : <rect
          className={styles.skeleton}
          x={x + 8}
          y={READ.y + 31}
          width={w - 16}
          height="8"
        />
      }
    </g>
  );
}
