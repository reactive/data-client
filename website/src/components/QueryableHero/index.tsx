/* eslint-disable @docusaurus/no-untranslated-text -- the app's text, as the
   page's live demos (never translated) render it under this, and names */
import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import {
  BEATS,
  REQUESTS,
  ROWS,
  SIDES,
  TRAVEL,
  WORLDS,
  beatOf,
  latency,
  runOf,
  type AppState,
  type Issue,
  type Pace,
  type Side,
  type View,
} from './beats';
import styles from './styles.module.css';
import { CLEAR, useRuns } from '../LookupTable/parts';
import { prefersReducedMotion } from '../motion';

/** What styles.module.css reads, so each value is written once */
const VARS = {
  '--travel': `${TRAVEL}ms`,
  '--clear': `${CLEAR}ms`,
  '--rows': ROWS,
} as React.CSSProperties;

/** A time in seconds, to a tenth: 6850 ms is 6.9 */
const seconds = (ms: number) => (Math.round(ms / 100) / 10).toFixed(1);

/**
 * Plays runs of the beats at `pace`: from the first beat to the last, again
 * and again while on screen. `play(beat)` starts a run at that beat. Until
 * the first run, and under reduced motion, it rests at a run's end, where
 * both apps are done; there, `play(beat)` plays that beat alone.
 */
function usePlayer(pace: Pace) {
  const [script, setScript] = useState(() => runOf(pace));
  const [frame, setFrame] = useState(script.end);
  /** the run a beat's pill started, and that beat */
  const [jump, setJump] = useState({ run: -1, beat: 0 });
  /** a run that starts at a later beat is that much shorter */
  const [period, setPeriod] = useState(script.period);
  const { run, restart, stage, playing } = useRuns(period);
  /** how many times a run has started: each start draws the apps anew */
  const [take, setTake] = useState(0);
  /** a run is playing, so what its frames change is news */
  const [live, setLive] = useState(false);
  const from = jump.run === run ? jump.beat : undefined;

  useEffect(() => {
    if (!playing) return;
    const still = prefersReducedMotion();
    // nothing plays on its own: it rests where every beat has played
    if (still && from === undefined) {
      const rest = runOf(pace);
      setScript(rest);
      setFrame(rest.end);
      setLive(false);
      return;
    }
    const next = runOf(pace, from, still ? 1 : undefined);
    const last = still ? next.end : next.frames.length - 1;
    setScript(next);
    setPeriod(next.period);
    setTake(t => t + 1);
    setLive(true);
    setFrame(0);
    const timers = next.frames
      .slice(1, last + 1)
      .map(({ at }, i) => window.setTimeout(() => setFrame(i + 1), at));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [run, playing, from, pace]);

  return {
    script,
    frame,
    take,
    live,
    stage,
    playing,
    play: (beat: number) => {
      setJump({ run: run + 1, beat });
      restart();
    },
    /** starts over from the first beat */
    replay: restart,
  };
}

/**
 * Two copies of one issue tracker take the same three clicks: one on a
 * cache keyed by request, one on Data Client. Each clicks at its own pace,
 * as soon as its screen shows the last click's result, and says how long it
 * took; Sync makes the faster wait, so both click at the same moments. Each
 * lists the requests it sends under it. The pills above show the beat
 * playing, the last one both apps have reached, and start one.
 */
export default function QueryableHero() {
  const [pace, setPace] = useState<Pace>('own');
  const { script, frame, take, live, stage, playing, play, replay } =
    usePlayer(pace);
  const now = script.frames[frame];
  const beat = beatOf(now);
  const whole = runOf('own');
  const beatLabels = {
    open: translate({
      id: 'queryableHero.beat.open',
      message: 'Open',
      description:
        'Queryable page hero: the pill of the first click, which opens an issue',
    }),
    close: translate({
      id: 'queryableHero.beat.close',
      message: 'Close',
      description:
        'Queryable page hero: the pill of the second click, which closes the issue',
    }),
    create: translate({
      id: 'queryableHero.beat.create',
      message: 'Create',
      description:
        'Queryable page hero: the pill of the third click, which creates an issue',
    }),
  };
  const sideLabels: Record<Side, { long: string; short: string }> = {
    keyed: {
      long: translate({
        id: 'queryableHero.keyed',
        message: 'Cache keyed by request',
        description:
          'Queryable page hero: the name over the app that stores each response under its request',
      }),
      short: translate({
        id: 'queryableHero.keyed.short',
        message: 'Keyed by request',
        description:
          'Queryable page hero: the short name, for a phone, over the app that stores each response under its request',
      }),
    },
    client: { long: 'Data Client', short: 'Data Client' },
  };
  const requestsLabel = translate({
    id: 'queryableHero.requests',
    message: 'Requests',
    description:
      'Queryable page hero: the label of the count of requests an app has sent, over those requests',
  });
  const syncLabel = translate({
    id: 'queryableHero.sync.label',
    message:
      'Sync the clicks: the faster app waits for the slower, so both click at the same moments',
    description:
      'Queryable page hero: accessible label and tooltip of the Sync switch, which makes both apps click together instead of each at its own pace',
  });

  return (
    <div
      ref={stage}
      className={styles.frame}
      style={VARS}
      data-paused={playing ? undefined : true}
    >
      <div className={styles.controls}>
        <div
          className={styles.beats}
          role="group"
          aria-label={translate({
            id: 'queryableHero.beats',
            message: 'Play from a click',
            description:
              'Queryable page hero: accessible label of the Open / Close / Create pills, which each start the animation at that click',
          })}
        >
          {BEATS.map(({ id }, i) => (
            <button
              key={id}
              type="button"
              aria-current={i === beat ? 'step' : undefined}
              data-done={i < beat ? true : undefined}
              onClick={() => play(i)}
            >
              {i === beat && (
                <i
                  key={take}
                  className={styles.progress}
                  style={
                    { '--span': `${script.spans[i]}ms` } as React.CSSProperties
                  }
                  // at rest, the beat has played
                  data-ended={frame >= script.end ? true : undefined}
                />
              )}
              <span>{beatLabels[id]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.sync}
          role="switch"
          aria-checked={pace === 'sync'}
          aria-label={syncLabel}
          title={syncLabel}
          onClick={() => {
            setPace(pace === 'sync' ? 'own' : 'sync');
            replay();
          }}
        >
          {translate({
            id: 'queryableHero.sync',
            message: 'Sync',
            description:
              'Queryable page hero: the short visible name of the switch that makes both apps click at the same moments',
          })}
          <i />
        </button>
      </div>
      <div
        className={styles.stage}
        role="img"
        aria-label={translate(
          {
            id: 'queryableHero.label',
            message:
              'Two copies of one issue tracker, one on a cache keyed by request and one on Data Client, take the same three clicks on the same network: a quarter second to read one issue, half a second to write one, a second for a list. Data Client’s mutations are optimistic. Opening issue 5 from the list: the cache keyed by request shows a loading placeholder and sends GET /issues/5, while Data Client renders the issue at once from the list’s data, with no request. Closing issue 5: both send PUT /issues/5. Data Client’s detail, list row and counts change together at once. The cache keyed by request changes its detail when the response returns, but its list still shows the issue open and its counts are out of date until it has refetched both lists: 3 requests. Creating issue 6: both send POST /issues. At once, Data Client adds the issue to the list and updates the counts, and opens its detail when the response returns. The cache keyed by request shows the new issue’s detail from the response, but refetches both lists: 3 requests. In total the cache keyed by request sends 7 requests, and Data Client sends 2. With each app clicking again as soon as its screen shows the last click’s result, Data Client is done in {client} seconds and the cache keyed by request in {keyed}',
            description:
              'Accessible label of the hero on the Queryable page. {client} and {keyed} are times in seconds, like 4.1',
          },
          {
            client: seconds(whole.took.client),
            keyed: seconds(whole.took.keyed),
          },
        )}
      >
        {SIDES.map(side => (
          <React.Fragment key={side}>
            <div className={clsx(styles.label, styles[side])}>
              <span className={styles.side}>
                <span className={styles.long}>{sideLabels[side].long}</span>
                <span className={styles.short}>{sideLabels[side].short}</span>
              </span>
              {/* in sync the faster app's time is the slower's, held back:
                  only each at its own pace is timed */}
              {pace === 'own' && (
                <Stopwatch
                  key={take}
                  took={now.apps[side].done ? script.took[side] : undefined}
                  ticking={live && playing}
                  clearing={now.clearing}
                />
              )}
            </div>
            <div className={clsx(styles.sheet, styles[side])}>
              <App
                key={take}
                app={now.apps[side]}
                live={live}
                clearing={now.clearing}
              />
            </div>
            <div className={clsx(styles.strip, styles[side])}>
              <Requests
                key={take}
                app={now.apps[side]}
                side={side}
                clearing={now.clearing}
                label={requestsLabel}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** The issue tracker on one screen: open counts, my issues, and the open
 * issue. Inert: the pointer is the only thing that clicks */
function App({
  app,
  live,
  clearing,
}: {
  app: AppState;
  /** a run is playing: at rest, nothing has just happened */
  live: boolean;
  clearing: boolean;
}) {
  /** whether a view re-rendered in this run, and at which frame */
  const news = (view: View) => (live ? app.rendered[view] : undefined);
  const list = WORLDS[app.shows.list];
  const counts = WORLDS[app.shows.counts];
  const stale = (view: View) => app.waits[view] === 'stale';
  const issue = WORLDS[app.shows.detail].open;
  const routed = WORLDS[app.route].open?.id;

  return (
    <div className={styles.run} data-clearing={clearing || undefined}>
      <div className={styles.app}>
        <div className={styles.head}>
          <span className={styles.title}>Issues</span>
          <span className={styles.counts}>
            <Flash at={news('counts')} />
            <Count label="Mine" value={counts.mine} stale={stale('counts')} />
            <Count label="All" value={counts.all} stale={stale('counts')} />
          </span>
          <span
            className={clsx(styles.button, styles.primary)}
            data-busy={app.busy === 'new' || undefined}
          >
            + New
          </span>
        </div>
        <div className={styles.list}>
          {list.rows.map(row => {
            // the row its list's last response changed, or brought
            const changed = row.id === list.open?.id && news('list');
            const arrived =
              changed &&
              !WORLDS[app.shows.list - 1].rows.some(({ id }) => id === row.id);
            return (
              <div
                key={row.id}
                className={styles.row}
                data-selected={row.id === routed || undefined}
                data-arrived={arrived || undefined}
              >
                <Flash at={changed || undefined} />
                <span className={styles.num}>#{row.id}</span>
                <span className={styles.name}>{row.title}</span>
                <State issue={row} stale={stale('list')} />
              </div>
            );
          })}
        </div>
        <div className={styles.detail}>
          <Flash at={news('detail')} />
          {app.waits.detail === 'loading' ?
            <div key="loading" className={styles.skeleton}>
              <i />
              <i />
            </div>
          : issue ?
            <div key={issue.id} className={styles.issue}>
              <div className={styles.name}>
                <span className={styles.num}>#{issue.id}</span> {issue.title}
              </div>
              <div className={styles.meta}>
                <State issue={issue} worded />
                <span className={styles.who}>· Maya</span>
                <span
                  className={styles.button}
                  data-busy={app.busy === 'close' || undefined}
                >
                  {issue.closed ? 'Reopen' : 'Close'}
                </span>
              </div>
            </div>
          : <div key="empty" className={styles.empty}>
              Select an issue
            </div>
          }
        </div>
        <span className={styles.pointer} data-at={app.pointer ?? 'rest'}>
          {/* the arrow the playgrounds' self-playing demos click with
              (../Playground/preview/autorun/stage.ts) */}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M0 0l17 10.5-7.4 1.4L6 19z" />
          </svg>
          {live && app.clicks > 0 && (
            <i key={app.clicks} className={styles.ring} />
          )}
        </span>
      </div>
    </div>
  );
}

/** How many issues are open, from a list. Stale, it is being refetched */
function Count({
  label,
  value,
  stale,
}: {
  label: string;
  value: number;
  stale: boolean;
}) {
  return (
    <span className={styles.count}>
      {label} <b key={value}>{value}</b>
      <i className={styles.spin} data-on={stale || undefined} />
    </span>
  );
}

/** An issue's state: a ring while open, a check once closed. `worded` adds
 * the word at any width. Stale, its list is being refetched */
function State({
  issue: { closed },
  stale,
  worded,
}: {
  issue: Issue;
  stale?: boolean;
  worded?: boolean;
}) {
  return (
    <span
      key={closed ? 'closed' : 'open'}
      className={clsx(styles.state, worded && styles.worded)}
      data-closed={closed || undefined}
      data-stale={stale || undefined}
    >
      <span className={styles.word}>{closed ? 'Closed' : 'Open'}</span>
      <span className={styles.dot}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          {closed ?
            <>
              <circle cx="6" cy="6" r="5.5" />
              <path d="M3.6 6.2l1.7 1.7 3.2-3.7" />
            </>
          : <circle cx="6" cy="6" r="4.25" />}
        </svg>
      </span>
    </span>
  );
}

/** A view re-rendering, like React DevTools' highlight: once, at frame `at` */
function Flash({ at }: { at: number | undefined }) {
  return at === undefined ? null : <i key={at} className={styles.flash} />;
}

/** The requests an app has sent: their count, then each as a chip that
 * fills while it is out. Every chip keeps its place from the start, so
 * both strips are as tall as the longer one from the first frame */
function Requests({
  app: { sent, landed, done },
  side,
  clearing,
  label,
}: {
  app: AppState;
  side: Side;
  clearing: boolean;
  label: string;
}) {
  return (
    <div className={styles.run} data-clearing={clearing || undefined}>
      <div className={styles.tally} data-on={done || undefined}>
        {label} <b>{sent}</b>
      </div>
      <div className={styles.chips}>
        {REQUESTS[side].map((request, i) => {
          const [method, path] = request.split(' ');
          return (
            <span
              key={i}
              className={styles.chip}
              style={
                { '--latency': `${latency(request)}ms` } as React.CSSProperties
              }
              data-mutation={method !== 'GET' || undefined}
              data-state={
                i >= sent ? 'queued'
                : i >= landed ?
                  'sent'
                : 'landed'
              }
            >
              <b>{method}</b>
              <span className={styles.path}>{path}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** How long an app has been at it: counting up while it works, then, once
 * it is done, how long it `took` */
function Stopwatch({
  took,
  ticking,
  clearing,
}: {
  took: number | undefined;
  /** a run is playing on screen */
  ticking: boolean;
  clearing: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const counting = ticking && took === undefined;
  useEffect(() => {
    if (!counting) return;
    // mounted as its run starts
    const start = performance.now();
    const timer = window.setInterval(
      () => setElapsed(performance.now() - start),
      100,
    );
    return () => window.clearInterval(timer);
  }, [counting]);

  const values = { seconds: seconds(took ?? elapsed) };
  const time = translate(
    {
      id: 'queryableHero.seconds',
      message: '{seconds} s',
      description:
        'Queryable page hero: how long an app has been working, in seconds, like 2.4 s',
    },
    values,
  );
  return (
    <span
      className={clsx(styles.run, styles.stopwatch)}
      data-done={took !== undefined || undefined}
      data-clearing={clearing || undefined}
    >
      {took !== undefined && (
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="M2.5 6.4l2.4 2.4 4.6-5.4" />
        </svg>
      )}
      <span className={styles.long}>
        {took === undefined ?
          time
        : translate(
            {
              id: 'queryableHero.done',
              message: 'Done in {seconds} s',
              description:
                'Queryable page hero: how long an app took to finish its clicks, in seconds, like Done in 4.1 s',
            },
            values,
          )
        }
      </span>
      {/* a phone has room for the time alone */}
      <span className={styles.short}>{time}</span>
    </span>
  );
}
