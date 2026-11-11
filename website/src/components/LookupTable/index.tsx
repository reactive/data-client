import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useState } from 'react';

import {
  ASSIGNEE,
  CALL_Y,
  CLEAR,
  Call,
  CallFlash,
  Entry,
  Flash,
  Frame,
  Get,
  GetList,
  ISSUES,
  ISSUE_H,
  IssueKey,
  IssueRow,
  Key,
  ListArgs,
  PK,
  Pk,
  Place,
  type Keyed,
  type Point,
  ReadCard,
  Run,
  Show,
  SkipRequest,
  Stage,
  Store,
  Strike,
  Switch,
  WIDTH,
  at,
  useRuns,
} from './parts';
import styles from './styles.module.css';

const HEIGHT = 284;

/** One run, in ms; then it starts over */
const PERIOD = 7400;
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

const STORE = { x: 6, y: 52, w: 408, h: 108 };
/** One entry of the table: its key, right-aligned, then its value */
const ENTRY = { x: 42, y: 60, w: 364, h: 20, pitch: 24, key: 196, value: 208 };
const ISSUE_W = 120;
/** What reads an endpoint: a page or component, and the request it would make */
const READ = { y: 178, h: 74 };
/** The first is wider: a list's label is its longest */
const READS = [
  { x: 6, w: 184 },
  { x: 198, w: 104 },
  { x: 310, w: 104 },
];

type Id = '5' | '6';
/** What a call does to an issue: nothing, stores it, or closes it */
type Change = 'kept' | 'new' | 'closed';
const IDS: Id[] = ['5', '6'];

/** The lists the store can hold, by the args they were fetched with */
type List = 'assignee' | 'all';
const LISTS: Record<
  List,
  { entry: number; request: string; assignee?: Keyed }
> = {
  assignee: {
    entry: 2,
    request: `GET /issues?assigneeId=${ASSIGNEE.id}`,
    assignee: ASSIGNEE,
  },
  all: { entry: 3, request: 'GET /issues' },
};

/** How data arrives. The mutation comes first: it shows the most */
const OPS = ['POST', 'GET', 'WebSocket'] as const;
type Op = (typeof OPS)[number];
/** The request or message that brings data: its text, around the value the table keys by */
const CALLS: Record<Op, [before: string, key: Keyed, after: string]> = {
  POST: ['POST /issues { assigneeId: ', ASSIGNEE, ", title: '…' }"],
  GET: ['GET /issues?assigneeId=', ASSIGNEE, ''],
  WebSocket: ['WebSocket: { id: ', ISSUES[5], ", state: 'closed' }"],
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

/**
 * The store as one lookup table. A call above writes into it once, then each
 * read below finds its data there by args, so the request it would have made
 * is crossed out. A tally compares the requests sent with what a cache keyed by
 * request would send. The switch picks how the data arrives.
 */
export default function LookupTable() {
  const [op, setOp] = useState<Op>(OPS[0]);
  const runs = useRuns(PERIOD);
  const scene = SCENES[op];
  const [before, key, after] = CALLS[op];

  // what the call brings starts out under it: the issues it stores or
  // overwrites, stacked, beside the pks of those new to the lists
  const arriving = IDS.filter(id => scene.issues[id] !== 'kept');
  const stored = IDS.filter(id => scene.issues[id] === 'new');
  const x0 = WIDTH / 2 - (ISSUE_W + PK.pitch * stored.length) / 2;
  const from = (id: Id): { issue: Point; pk: Point } => ({
    issue: [x0, CALL_Y + 6 + (ISSUE_H + 3) * arriving.indexOf(id)],
    pk: [x0 + ISSUE_W + 4 + PK.pitch * stored.indexOf(id), CALL_Y + 6],
  });

  const reads = scene.reads.map((read, i) => {
    const list = isList(read);
    const ids = list ? IDS : [read];
    const { x, w } = READS[i];
    return {
      x,
      w,
      y: READ.y,
      h: READ.h,
      binding: `M${x + w / 2} ${STORE.y + STORE.h}V${READ.y}`,
      label:
        list ?
          <GetList assignee={LISTS[read].assignee} />
        : <Get issue={ISSUES[read]} />,
      request: list ? LISTS[read].request : `GET /issues/${read}`,
      // the call above is this read's own request
      sent: list && !!scene.newLists,
      ids,
      // a list is in the table once fetched; an issue, once any response held it
      found: list ? !scene.newLists : scene.issues[read] !== 'new',
      at: AT.read + (scene.together ? 0 : AT.next * i),
      rowY: (id: Id) => READ.y + (list ? 22 + 17 * ids.indexOf(id) : 28),
    };
  });
  const total = scene.sends + reads.filter(read => !read.sent).length;
  const tallyAt = reads[reads.length - 1].at + AT.tally;

  // Each part of the table is drawn twice: as it was before the call, and
  // (`after`) as what the call adds or changes, which travels in from the call

  const issueEntries = (after: boolean) =>
    IDS.map((id, i) => {
      const change = scene.issues[id];
      if (change === (after ? 'kept' : 'new')) return null;
      return (
        <React.Fragment key={id}>
          {(!after || change === 'new') && (
            <Entry
              {...ENTRY}
              y={entryY(i)}
              keyX={ENTRY.key}
              lands={after ? AT.land : undefined}
            >
              <IssueKey issue={ISSUES[id]} />
            </Entry>
          )}
          {/* an issue's new fields overwrite its one entry */}
          <Place
            to={[ENTRY.value, entryY(i) + 3]}
            from={after ? from(id).issue : undefined}
            at={AT.arrive}
          >
            <IssueRow
              issue={ISSUES[id]}
              w={ISSUE_W}
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
          <Entry
            {...ENTRY}
            y={entryY(LISTS[list].entry)}
            keyX={ENTRY.key}
            lands={after ? AT.land : undefined}
          >
            <ListArgs assignee={LISTS[list].assignee} />
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
                at={AT.arrive}
              >
                <Pk issue={ISSUES[id]} />
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
              issue={ISSUES[id]}
              w={read.w - 16}
              closed={after && scene.issues[id] === 'closed'}
            />
          </Place>
        ),
    );

  return (
    <Frame>
      <Switch
        label={translate({
          id: 'lookupTable.transport',
          message: 'Data arrives from',
          description:
            'Label of the POST / GET / WebSocket switch on the lookup table diagram of the Queryable page',
        })}
        options={OPS}
        value={op}
        // every change of `op` starts a new run
        onChange={o => {
          setOp(o);
          runs.restart();
        }}
      />
      <Stage
        runs={runs}
        height={HEIGHT}
        label={translate({
          id: 'lookupTable.label',
          message:
            'The store as one lookup table: Issue 5 and Issue 6 by pk, and the lists for { assigneeId: 1 } and { } by args. POST /issues with assigneeId 1 is one request. It stores Issue 6 and adds it to both lists, so getList({ assigneeId: 1 }), getList() and get({ id: 6 }) each render it without the request they would otherwise make: 1 request, where a cache keyed by request sends 4. GET /issues?assigneeId=1 stores Issue 5, Issue 6 and their list, so get({ id: 5 }) and get({ id: 6 }) render without a request: 1 request, not 3. A websocket message that closes Issue 5 changes its one entry, so both lists and get({ id: 5 }) show it closed: 0 requests, not 3',
          description:
            'Accessible label of the lookup table diagram on the Queryable page',
        })}
      >
        <Store {...STORE} />

        {/* what is there before the call: it stays put from run to run */}
        <Call>
          {before}
          <Key of={key} />
          {after}
        </Call>
        {issueEntries(false)}
        {listEntries(false)}
        {reads.map(read => (
          <ReadCard key={read.x} read={read} found={read.found}>
            {read.found && readRows(read, ['kept', 'closed'])}
          </ReadCard>
        ))}

        {/* what the call changes */}
        {runs.playing && (
          <Run key={runs.run} clearAt={AT.clear}>
            <CallFlash chars={(before + key.id + after).length} />
            {issueEntries(true)}
            {listEntries(true)}

            {reads.map(read => (
              <g key={read.x} style={at(read.at)}>
                {read.found ?
                  <>
                    {/* flashes when it re-renders, like React DevTools' highlight */}
                    <Flash x={read.x} y={read.y} w={read.w} h={read.h} />
                    <Show>{readRows(read, ['new', 'closed'], true)}</Show>
                  </>
                : <Show>
                    <ReadCard read={read} found>
                      {readRows(read, ['kept', 'new', 'closed'], true)}
                    </ReadCard>
                  </Show>
                }
                {!read.sent && (
                  <SkipRequest read={read} at={read.at + AT.skip} />
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
              <Strike
                x={WIDTH / 2 + 15}
                y={269.5}
                w={14}
                at={tallyAt + AT.skip}
              />
              <text className={styles.sends} x={WIDTH / 2 + 42} y="274">
                {scene.sends}
              </text>
            </g>
          </Run>
        )}
      </Stage>
    </Frame>
  );
}

/** Where a list's entry holds the pk of its `index`th issue */
function pkAt(list: List, index: number): Point {
  return [ENTRY.value + PK.pitch * index, entryY(LISTS[list].entry) + 3];
}
