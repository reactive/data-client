import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

import { actionName, type SubjectFilter } from './actionGroups';
import type { LogEntry } from './actionLog';
import { TypeName, useActions } from './actionParts';
import { APP, pipeline, routesOf, shownChain } from './attribution';
import styles from './store.module.css';

/** Every dispatch's way to the store: the app, then each manager of the
 * chain in order, then the store. Each stage says how many actions it sent
 * and (⊘) handled without passing on, and those that did neither fold into
 * runs; picking one (`picked`, again to let go) shows only its actions */
export function Pipeline({
  chain,
  entries,
  picked,
  onPick,
}: {
  chain: readonly string[];
  entries: readonly LogEntry[];
  picked: string | null;
  onPick: (stage: string | null) => void;
}) {
  const stages = useMemo(() => pipeline(chain, entries), [chain, entries]);
  return (
    <Strip
      label="Pipeline: who sent the actions, and who handled them"
      stages={stages.map(({ id, sent, handled }) => ({
        id,
        foldAs:
          id !== APP && !sent && !handled && picked !== id ? 'idle' : undefined,
        node: (
          <button
            type="button"
            className={styles.stage}
            aria-pressed={picked === id}
            onClick={() => onPick(picked === id ? null : id)}
          >
            {id}
            <span className={sent ? styles.number : styles.dim}>{sent}</span>
            {handled > 0 && (
              <span className={styles.stageNote}>⊘ {handled}</span>
            )}
          </button>
        ),
      }))}
    />
  );
}

/** The way `entry` took: who sent it (the app, or a manager), each manager
 * it passed, the one that handled it (⊘) and those after, which never saw
 * it, and whether it reached the store. Runs of managers it only passed, or
 * that never saw it, fold */
export function ActionPath({
  chain,
  entry: { seq, action, origin = APP, consumedBy, store },
}: {
  chain: readonly string[];
  entry: LogEntry;
}) {
  // a manager's dispatch starts down the chain from its top, not the app
  const ids = origin === APP ? [APP, ...chain] : chain;
  const stop = consumedBy ? ids.indexOf(consumedBy) : -1;
  return (
    <Strip
      // another action's path starts folded
      key={seq}
      label={'Path of ' + actionName(action) + ' through the managers'}
      stored={!!store}
      stages={ids.map((id, i) => {
        const after = stop >= 0 && i > stop;
        return {
          id,
          foldAs:
            id === origin || i === stop ? undefined
            : after ? 'never saw it'
            : 'passed',
          node: (
            <span
              className={clsx(
                styles.stage,
                id === origin && styles.stageSender,
                i === stop && styles.stageStop,
                after && styles.stageOff,
              )}
            >
              {id}
              {id === origin && id !== APP && (
                <span className={styles.stageNote}>↑ sent it</span>
              )}
              {i === stop && (
                <span className={styles.stageNote}>⊘ handled it</span>
              )}
            </span>
          ),
        };
      })}
    />
  );
}

/** Each way `entries` (a request's actions, those `filter` lists) took
 * through the managers, once, with how many took it: a fetch the app sent
 * and NetworkManager handled, then the response it sent on to the store */
export function GroupPaths({
  entries,
  filter,
}: {
  entries: readonly LogEntry[];
  filter: SubjectFilter;
}) {
  const chain = shownChain(useActions().history.managers);
  const routes = useMemo(
    () => routesOf(entries.filter(filter.lists)),
    [entries, filter],
  );
  if (!chain) return null;
  return (
    <>
      {routes.map(({ entry, n }) => (
        <div key={entry.seq} className={styles.route}>
          <span className={styles.routeName}>
            <TypeName entry={entry} />
            {n > 1 && (
              <span className={styles.dim} title={n + ' actions took this way'}>
                {' '}
                ×{n}
              </span>
            )}
          </span>
          <ActionPath chain={chain} entry={entry} />
        </div>
      ))}
    </>
  );
}

interface Shown {
  /** The stage's name */
  readonly id: string;
  /** What a run of stages like this one folds into ("3 idle"), if any:
   * only stages with the same label fold together */
  readonly foldAs?: string;
  readonly node: React.ReactElement;
}

/** `stages` joined by arrows, wrapping as needed, ending at the store (dim
 * when the action never reached it, `stored` false). Two or more stages in
 * a row that fold alike show as one, until it's opened */
function Strip({
  label,
  stored = true,
  stages,
}: {
  label: string;
  stored?: boolean;
  stages: readonly Shown[];
}) {
  /** The stages of the runs opened: a run (of two or more) is open while
   * any of its stages is, so one that grows or shrinks as managers start or
   * stop acting stays open */
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const runs = foldRuns(stages);
  const isOpen = (run: readonly Shown[]) =>
    run.length > 1 && run.some(stage => opened.has(stage.id));
  // only the stages of runs open now: a run that splits up closes, so a
  // manager that left it can't reopen another run it joins later
  const openNow = new Set(
    runs
      .filter(isOpen)
      .flat()
      .map(stage => stage.id),
  );
  // synced while rendering, so a stale open run is never painted; a manager
  // can leave a run and another join it in one render, so compare members
  if (openNow.size !== opened.size || [...openNow].some(id => !opened.has(id)))
    setOpened(openNow);
  return (
    <div className={styles.pipeline} role="group" aria-label={label}>
      {runs.flatMap(run => {
        const key = run[0].id;
        if (run.length === 1) return [<Step key={key}>{run[0].node}</Step>];
        const ids = run.map(stage => stage.id);
        const names = ids.join(', ');
        const open = isOpen(run);
        const text = open ? 'fold' : run.length + ' ' + run[0].foldAs;
        const button = (
          <button
            key="fold"
            type="button"
            className={clsx(styles.stage, styles.stageFold)}
            title={names}
            aria-label={text + ': ' + names}
            aria-expanded={open}
            onClick={() =>
              setOpened(
                new Set(
                  open ?
                    [...openNow].filter(id => !ids.includes(id))
                  : [...openNow, ...ids],
                ),
              )
            }
          >
            {text}
          </button>
        );
        // the button keeps one keyed slot, open or folded, so the one
        // pressed stays (and keeps focus); open, it follows the run's last
        // stage in that slot, so it never wraps away from the run (keyed
        // lists both ways, so React matches the button by its key)
        const last = run[run.length - 1];
        return [
          ...(open ? run.slice(0, -1) : []).map(stage => (
            <Step key={stage.id}>{stage.node}</Step>
          )),
          <Step key={'fold:' + key}>
            {open ?
              [
                <React.Fragment key={last.id}>{last.node}</React.Fragment>,
                button,
              ]
            : [button]}
          </Step>,
        ];
      })}
      <Step arrow={false}>
        <span
          className={clsx(
            styles.stage,
            styles.stageEnd,
            !stored && styles.stageOff,
          )}
        >
          store
        </span>
      </Step>
    </div>
  );
}

/** A stage and the arrow after it (none after the store), which wraps with
 * it, so a line never starts with one */
function Step({
  arrow = true,
  children,
}: {
  arrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={styles.stageStep}>
      {children}
      {arrow && (
        <span className={styles.stageArrow} aria-hidden>
          →
        </span>
      )}
    </span>
  );
}

/** `stages`, each run of alike folding ones as one */
function foldRuns(stages: readonly Shown[]): Shown[][] {
  const runs: Shown[][] = [];
  for (const stage of stages) {
    const last = runs.at(-1);
    if (stage.foldAs && last?.[0].foldAs === stage.foldAs) last.push(stage);
    else runs.push([stage]);
  }
  return runs;
}
