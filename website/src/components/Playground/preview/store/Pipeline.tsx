import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

import type { LogEntry } from './actionLog';
import { TypeName } from './actionParts';
import { APP, pipeline, routesOf } from './attribution';
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
        quiet: id !== APP && !sent && !handled && picked !== id && 'idle',
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
  entry: { action, origin = APP, consumedBy, store },
}: {
  chain: readonly string[];
  entry: LogEntry;
}) {
  // a manager's dispatch starts down the chain from its top, not the app
  const ids = origin === APP ? [APP, ...chain] : chain;
  const stop = consumedBy ? ids.indexOf(consumedBy) : -1;
  return (
    <Strip
      label={`Path of ${action.type} through the managers`}
      stored={!!store}
      stages={ids.map((id, i) => {
        const after = stop >= 0 && i > stop;
        return {
          id,
          quiet:
            id !== origin && i !== stop && (after ? 'never saw it' : 'passed'),
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

/** Each way `entries` (a request's actions) took, once, with how many took
 * it: a fetch the app sent and NetworkManager handled, then the response it
 * sent on to the store */
export function GroupPaths({
  chain,
  entries,
}: {
  chain: readonly string[];
  entries: readonly LogEntry[];
}) {
  const routes = useMemo(() => routesOf(entries), [entries]);
  return (
    <>
      {routes.map(({ entry, n }) => (
        <div key={entry.seq} className={styles.route}>
          <span className={styles.routeName}>
            <TypeName entry={entry} />
            {n > 1 && <span className={styles.dim}> ×{n}</span>}
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
  /** What a run of stages like this one folds into ("3 idle"), if any */
  readonly quiet?: string | false;
  readonly node: React.ReactElement;
}

/** `stages` joined by arrows, wrapping as needed, ending at the store (dim
 * when the action never reached it, `stored` false). Two or more quiet
 * stages in a row fold into one, until it's opened */
function Strip({
  label,
  stored = true,
  stages,
}: {
  label: string;
  stored?: boolean;
  stages: readonly Shown[];
}) {
  const [open, setOpen] = useState(false);
  const folded = foldRuns(stages);
  const runs = open ? stages.map(stage => [stage]) : folded;
  return (
    <div className={styles.pipeline} role="group" aria-label={label}>
      {runs.map(run => (
        // each arrow wraps with the stage it leaves, so a line never starts
        // with one
        <span key={run[0].id} className={styles.stageStep}>
          {run.length > 1 ?
            <button
              type="button"
              className={styles.stageFold}
              title={run.map(stage => stage.id).join(', ')}
              aria-expanded={false}
              onClick={() => setOpen(true)}
            >
              {run.length} {run[0].quiet}
            </button>
          : run[0].node}
          <span className={styles.stageArrow} aria-hidden>
            →
          </span>
        </span>
      ))}
      <span className={styles.stageStep}>
        <span
          className={clsx(
            styles.stage,
            styles.stageEnd,
            !stored && styles.stageOff,
          )}
        >
          store
        </span>
      </span>
      {open && folded.length < stages.length && (
        <button
          type="button"
          className={styles.stageFold}
          aria-expanded
          onClick={() => setOpen(false)}
        >
          fold
        </button>
      )}
    </div>
  );
}

/** `stages`, each run of two or more alike quiet ones as one */
function foldRuns(stages: readonly Shown[]): Shown[][] {
  const runs: Shown[][] = [];
  for (const stage of stages) {
    const last = runs.at(-1);
    if (stage.quiet && last?.[0].quiet === stage.quiet) last.push(stage);
    else runs.push([stage]);
  }
  return runs.flatMap(run => (run.length > 1 ? [run] : run.map(s => [s])));
}
