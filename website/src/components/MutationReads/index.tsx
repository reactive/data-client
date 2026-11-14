import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { isValidElement, useState } from 'react';

import styles from './styles.module.css';
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
  IssueKey,
  IssueRow,
  Key,
  type Keyed,
  ListArgs,
  Pk,
  Place,
  type Point,
  type Read,
  ReadCard,
  Run,
  Show,
  SkipRequest,
  Stage,
  Store,
  Switch,
  WIDTH,
  at,
  useRuns,
} from '../LookupTable/parts';

const HEIGHT = 304;

/** One run, in ms; then it starts over */
const PERIOD = 6000;
/** When each part of a run starts, in ms */
const AT = {
  /** what the call writes leaves for the table, and what it removes goes */
  change: 600,
  /** a new entry shows as its value lands */
  land: 1400,
  /** the first read re-renders; each one below it, `next` later */
  read: 2300,
  next: 150,
  /** its request is crossed out */
  skip: 200,
  /** what the run changed goes back, so the next starts clean */
  clear: PERIOD - CLEAR,
};

/** The issue every mutation here is about */
const ISSUE = ISSUES[6];
/** The assignee it can move to */
const OTHER: Keyed = { id: '2', hue: styles.assignee2 };

const STORE = { x: 6, y: 52, w: 200, h: 250 };
/** What reads the table, one under the next, each beside the entry it finds */
const READ = { x: 226, y: 60, w: 188, h: 54, pitch: 60 };
/** One entry of the table: its key, right-aligned, then its value */
const ENTRY = { x: 34, w: 166, h: 20, key: 146, value: 154, valueW: 40 };
/** Room at the end of a read's row for what the write did for it */
const STATUS_W = 56;
/** Where what a call brings starts out: under the call */
const FROM: { issue: Point; pk: Point } = {
  issue: [WIDTH / 2 - ENTRY.valueW - 2, CALL_Y + 6],
  pk: [WIDTH / 2 + 2, CALL_Y + 6],
};

type List = 'assignee' | 'other' | 'all';
type Row = 'issue' | List;
/** What the table holds, top to bottom: Issue 6, then the lists by their args */
const ROWS = (
  [
    { row: 'issue', request: `GET /issues/${ISSUE.id}` },
    {
      row: 'assignee',
      assignee: ASSIGNEE,
      request: `GET /issues?assigneeId=${ASSIGNEE.id}`,
    },
    {
      row: 'other',
      assignee: OTHER,
      request: `GET /issues?assigneeId=${OTHER.id}`,
    },
    { row: 'all', request: 'GET /issues' },
  ] satisfies { row: Row; assignee?: Keyed; request: string }[]
).map(({ row, assignee, request }, i) => {
  const y = READ.y + READ.pitch * i;
  const entryY = y + (READ.h - ENTRY.h) / 2;
  return {
    row,
    key:
      row === 'issue' ?
        <IssueKey issue={ISSUE} />
      : <ListArgs assignee={assignee} />,
    entry: { ...ENTRY, y: entryY, keyX: ENTRY.key },
    /** where the entry's value goes */
    value: [ENTRY.value, entryY + 3] as Point,
    read: {
      ...READ,
      y,
      binding: `M${STORE.x + STORE.w} ${y + READ.h / 2}H${READ.x}`,
      label:
        row === 'issue' ?
          <Get issue={ISSUE} />
        : <GetList assignee={assignee} />,
      request,
    } satisfies Read,
    /** when it re-renders */
    at: AT.read + AT.next * i,
  };
});

/** One per row of the page's table, in its order */
const OPS = ['push', 'update', 'move', 'remove', 'delete', 'set'] as const;
type Op = (typeof OPS)[number];
type State = 'open' | 'closed';
/** A list of every issue has the issue too, until it is taken out */
const HELD: List[] = ['assignee', 'all'];

interface Scene {
  /** the call: its text, around the values the table keys by */
  call: (string | Keyed)[];
  /** Issue 6's entry before and after the call: its state, or null when the table has none */
  issue: [State | null, State | null];
  /** the lists that hold Issue 6, before and after */
  holds: [List[], List[]];
  /** a list this call stores: the table had no entry for it */
  stores?: List;
  /** what the call's write renders next, without a fetch */
  serves: Row[];
}
const SCENES: Record<Op, Scene> = {
  // the lists whose args the request matches get the new issue, and it is its own detail
  push: {
    call: ['getList.push({ assigneeId: ', ASSIGNEE, ", title: '…' })"],
    issue: [null, 'open'],
    holds: [[], HELD],
    serves: ['issue', 'assignee', 'all'],
  },
  // an edit changes the one entry every read shows
  update: {
    call: ['partialUpdate({ id: ', ISSUE, " }, { state: 'closed' })"],
    issue: ['open', 'closed'],
    holds: [HELD, HELD],
    serves: ['issue', 'assignee', 'all'],
  },
  // out of the lists its old fields match, into those its new fields match
  move: {
    call: ['getList.move({ id: ', ISSUE, ' }, { assigneeId: ', OTHER, ' })'],
    issue: ['open', 'open'],
    holds: [HELD, ['other', 'all']],
    serves: ['assignee', 'other'],
  },
  // out of every list the args match; the issue itself stays
  remove: {
    call: [
      'getList.remove({ assigneeId: ',
      ASSIGNEE,
      ' }, { id: ',
      ISSUE,
      ' })',
    ],
    issue: ['open', 'open'],
    holds: [HELD, []],
    serves: ['issue', 'assignee', 'all'],
  },
  // the issue is Invalid: lists leave it out, and its detail has to fetch
  delete: {
    call: ['delete({ id: ', ISSUE, ' })'],
    issue: ['open', null],
    holds: [HELD, []],
    serves: ['assignee', 'all'],
  },
  // no request: it writes the one list it names, and the issues in it
  set: {
    call: [
      'ctrl.set(getList.schema, { assigneeId: ',
      OTHER,
      ' }, [{ id: ',
      ISSUE,
      ' }])',
    ],
    issue: [null, 'open'],
    holds: [[], ['other']],
    stores: 'other',
    serves: ['issue', 'other'],
  },
};

const elements = (node: React.ReactNode) =>
  React.Children.toArray(node).filter(child =>
    isValidElement<{ children?: React.ReactNode }>(child),
  );
/** Each body row's cells, from the markdown table MDX passes as children */
function tableRows(children: React.ReactNode): React.ReactNode[][] {
  const [table] = elements(children);
  // a table's children are its head, then its body
  const body = table && elements(table.props.children)[1];
  if (!body) return [];
  return elements(body.props.children).map(row =>
    elements(row.props.children).map(cell => cell.props.children),
  );
}

/**
 * What each kind of mutation writes into the store's lookup table, beside the
 * reads that render from it next: an issue's detail, two assignees' lists and
 * the list of every issue. A read the write serves has its request crossed
 * out; one it leaves without data fetches. The switch picks the mutation.
 *
 * Its children are the page's markdown table of the same outcomes, one row per
 * option of the switch, in order. Agents read that table in the page's
 * markdown; here the chosen row is the diagram's caption.
 */
export default function MutationReads({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [op, setOp] = useState<Op>(OPS[0]);
  const runs = useRuns(PERIOD);
  const scene = SCENES[op];
  const captions = tableRows(children);

  /** What a row has before (0) and after (1) the call: whether its entry is
   * in the table, and Issue 6's state where it holds the issue */
  const view = (row: Row, when: 0 | 1) => {
    const issue = scene.issue[when];
    if (row === 'issue') return { found: !!issue, state: issue };
    return {
      found: !!when || scene.stores !== row,
      state: scene.holds[when].includes(row) ? issue : null,
    };
  };
  const rows = ROWS.map(row => {
    const before = view(row.row, 0);
    const after = view(row.row, 1);
    return {
      ...row,
      before,
      after,
      /** its entry's value: the issue, or the issue's pk in a list. An edit
       * overwrites the issue's */
      wrote:
        !!after.state &&
        (row.row === 'issue' ? after.state !== before.state : !before.state),
      served: scene.serves.includes(row.row),
    };
  });
  // a pk that leaves one list as it joins another goes straight there
  const left = rows.find(row => row.before.state && !row.after.state);

  const value = ({ row }: (typeof rows)[number], state: State) =>
    row === 'issue' ?
      <IssueRow issue={ISSUE} w={ENTRY.valueW} closed={state === 'closed'} />
    : <Pk issue={ISSUE} />;
  const readRow = ({ read }: (typeof rows)[number], state: State) => (
    <Place to={[read.x + 8, read.y + 21]}>
      <IssueRow
        issue={ISSUE}
        w={read.w - 16 - STATUS_W}
        closed={state === 'closed'}
      />
    </Place>
  );

  return (
    <Frame className={styles.frame}>
      <Switch
        dense
        label={translate({
          id: 'mutationReads.mutation',
          message: 'Mutation',
          description:
            'Label of the push / update / move / remove / delete / set switch on the mutations diagram of the Queryable page',
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
          id: 'mutationReads.label',
          message:
            'The store as one lookup table, beside the four reads that find their data in it: get({ id: 6 }), getList({ assigneeId: 1 }), getList({ assigneeId: 2 }) and getList(). getList.push with assigneeId 1 stores Issue 6 and adds it to the lists for { assigneeId: 1 } and { }, so get({ id: 6 }) and both lists render it without a fetch. partialUpdate closes Issue 6 in its one entry, so its detail and both lists that hold it show it closed without a fetch. getList.move to assigneeId 2 takes Issue 6 out of the list for { assigneeId: 1 } and adds it to the list for { assigneeId: 2 }, so both render without a fetch. getList.remove takes Issue 6 out of the lists its args match, so they render without it, and get({ id: 6 }) still renders. delete takes Issue 6 out of the table: the lists render without it, and get({ id: 6 }) fetches. ctrl.set() with the list for { assigneeId: 2 } stores that list and Issue 6 without a request, so getList({ assigneeId: 2 }) and get({ id: 6 }) render without a fetch',
          description:
            'Accessible label of the mutations diagram on the Queryable page',
        })}
      >
        <Store {...STORE} />

        {/* what is there before the call */}
        <Call>
          {scene.call.map((part, i) =>
            typeof part === 'string' ? part : <Key key={i} of={part} />,
          )}
        </Call>
        {rows.map(row => {
          const { before, after } = row;
          return (
            <React.Fragment key={row.row}>
              {before.found && (
                <Leaves runs={runs} at={after.found ? undefined : AT.change}>
                  <Entry {...row.entry}>{row.key}</Entry>
                  {before.state && (
                    <Leaves
                      runs={runs}
                      at={after.found && !after.state ? AT.change : undefined}
                    >
                      <Place to={row.value}>{value(row, before.state)}</Place>
                    </Leaves>
                  )}
                </Leaves>
              )}
              {/* a read that loses its data goes; one that loses a row keeps the rest */}
              <Leaves
                runs={runs}
                at={before.found && !after.found ? row.at : undefined}
              >
                <ReadCard read={row.read} found={before.found}>
                  {before.state && (
                    <Leaves
                      runs={runs}
                      at={after.found && !after.state ? row.at : undefined}
                    >
                      {readRow(row, before.state)}
                    </Leaves>
                  )}
                </ReadCard>
              </Leaves>
            </React.Fragment>
          );
        })}

        {/* what the call changes */}
        {runs.playing && (
          <Run key={runs.run} clearAt={AT.clear}>
            <CallFlash
              chars={scene.call.reduce(
                (n, part) =>
                  n + (typeof part === 'string' ? part : part.id).length,
                0,
              )}
            />
            {rows.map(row => {
              const { before, after, read } = row;
              return (
                <React.Fragment key={row.row}>
                  {!before.found && after.found && (
                    <Entry {...row.entry} lands={AT.land}>
                      {row.key}
                    </Entry>
                  )}
                  {row.wrote && after.state && (
                    <Place
                      to={row.value}
                      from={
                        row.row === 'issue' ? FROM.issue
                        : left ?
                          left.value
                        : FROM.pk
                      }
                      at={AT.change}
                    >
                      {value(row, after.state)}
                    </Place>
                  )}

                  <g style={at(row.at)}>
                    {before.found !== after.found ?
                      <Show>
                        {/* without its data, a read sends its request */}
                        <ReadCard
                          read={{ ...read, sent: !after.found }}
                          found={after.found}
                        >
                          {after.state && readRow(row, after.state)}
                        </ReadCard>
                        {!after.found && (
                          <text
                            className={clsx(styles.status, styles.fetches)}
                            x={read.x + read.w - 8}
                            y={read.y + read.h - 8}
                          >
                            {translate({
                              id: 'mutationReads.fetches',
                              message: 'fetches',
                              description:
                                'On the mutations diagram, beside the request of a read whose data a delete removed: the read fetches. Keep it short',
                            })}
                          </text>
                        )}
                      </Show>
                    : row.served && (
                        <>
                          {/* flashes when it re-renders, like React DevTools' highlight */}
                          <Flash x={read.x} y={read.y} w={read.w} h={read.h} />
                          {after.state && after.state !== before.state && (
                            <Show>{readRow(row, after.state)}</Show>
                          )}
                        </>
                      )
                    }
                    {row.served && (
                      <>
                        <SkipRequest read={read} at={row.at + AT.skip} />
                        <Show>
                          <text
                            className={styles.status}
                            x={read.x + read.w - 8}
                            y={read.y + 31.5}
                          >
                            {translate({
                              id: 'mutationReads.noFetch',
                              message: 'no fetch',
                              description:
                                'On the mutations diagram, in a read that renders what the mutation wrote: it sends no request. Keep it short',
                            })}
                          </text>
                        </Show>
                      </>
                    )}
                  </g>
                </React.Fragment>
              );
            })}
          </Run>
        )}
      </Stage>
      {/* every row keeps its place, so the page doesn't shift from one to the next */}
      <div className={styles.captions}>
        {captions.map(([mutation, renders], i) => (
          <p
            key={i}
            className={clsx(styles.caption, OPS[i] !== op && styles.off)}
          >
            <strong>{mutation}</strong>
            {renders}
          </p>
        ))}
      </div>
    </Frame>
  );
}

/**
 * What the call takes away: there before each run, gone from `at`, and back
 * as the run clears. Without `at` it stays.
 */
function Leaves({
  runs: { run, playing },
  at: ms,
  children,
}: {
  runs: Pick<ReturnType<typeof useRuns>, 'run' | 'playing'>;
  at?: number;
  children: React.ReactNode;
}) {
  if (ms === undefined || !playing) return <>{children}</>;
  return (
    <g
      // each run starts over
      key={run}
      className={styles.leave}
      style={
        {
          ...at(ms),
          '--back': `${AT.clear}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </g>
  );
}
