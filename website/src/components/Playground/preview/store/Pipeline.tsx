import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

import { actionName } from './actionGroups';
import type { LogEntry } from './actionLog';
import {
  isApp,
  originOf,
  pipeline,
  sameStage,
  stageName,
  stagesOf,
  type ManagerStage,
  type Stage,
} from './attribution';
import { CodeLink, ManagerName } from './ManagerName';
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
  chain: readonly ManagerStage[];
  entries: readonly LogEntry[];
  picked: Stage | null;
  onPick: (stage: Stage | null) => void;
}) {
  const stages = useMemo(() => pipeline(chain, entries), [chain, entries]);
  return (
    <Strip
      className={styles.pipelineBar}
      label="Pipeline: who sent the actions, and who handled them"
      stages={stages.map(({ stage, sent, handled }) => ({
        id: stage.id,
        name: stageName(stage),
        foldAs:
          !isApp(stage) && !sent && !handled && !sameStage(stage, picked) ?
            'idle'
          : undefined,
        node: (
          <>
            <button
              type="button"
              className={styles.stage}
              aria-pressed={sameStage(stage, picked)}
              onClick={() => onPick(sameStage(stage, picked) ? null : stage)}
            >
              {stageName(stage)}
              <span className={sent ? styles.number : styles.dim}>{sent}</span>
              {handled > 0 && (
                <span className={styles.stageNote}>⊘ {handled}</span>
              )}
            </button>
            {!isApp(stage) && <CodeLink stage={stage} />}
          </>
        ),
      }))}
    />
  );
}

/** The way `entry` took: who sent it (the app, or a manager), each manager
 * it passed, the one that handled it (⊘) and those after, which never saw
 * it, and whether it reached the store. Runs of managers it only passed, or
 * that never saw it, fold */
function ActionPath({
  chain,
  entry,
  children,
}: {
  chain: readonly ManagerStage[];
  entry: LogEntry;
  /** After the store, on its line */
  children?: React.ReactNode;
}) {
  const { seq, action, consumedBy, store } = entry;
  const origin = originOf(entry);
  // a manager's dispatch starts down the chain from its top, not the app
  const stages = isApp(origin) ? stagesOf(chain) : chain;
  const stop =
    consumedBy ? stages.findIndex(stage => sameStage(stage, consumedBy)) : -1;
  return (
    <Strip
      // another action's path starts folded
      key={seq}
      label={'Path of ' + actionName(action) + ' through the managers'}
      stored={!!store}
      stages={stages.map((stage, i) => {
        const after = stop >= 0 && i > stop;
        return {
          id: stage.id,
          name: stageName(stage),
          foldAs:
            sameStage(stage, origin) || i === stop ? undefined
            : after ? 'never saw it'
            : 'passed',
          node: (
            <span
              className={clsx(
                styles.stage,
                sameStage(stage, origin) && styles.stageSender,
                i === stop && styles.stageStop,
                after && styles.stageOff,
              )}
            >
              {isApp(stage) ? stageName(stage) : <ManagerName stage={stage} />}
              {sameStage(stage, origin) && !isApp(stage) && (
                <span className={styles.stageNote}>↑ sent it</span>
              )}
              {i === stop && (
                <span className={styles.stageNote}>⊘ handled it</span>
              )}
            </span>
          ),
        };
      })}
    >
      {children}
    </Strip>
  );
}

/** The path one way a request's actions took through the managers, under
 * the first step to take it, with how many took it */
export function StepPath({
  chain,
  entry,
  n,
}: {
  chain: readonly ManagerStage[];
  entry: LogEntry;
  n: number;
}) {
  return (
    <div className={styles.stepPath}>
      <ActionPath chain={chain} entry={entry}>
        {n > 1 && (
          <span
            className={styles.stepCount}
            title={n + ' actions took this way'}
          >
            ×{n}
          </span>
        )}
      </ActionPath>
    </div>
  );
}

interface Shown {
  /** The stage's `id` */
  readonly id: string;
  /** Its name, as a fold lists it */
  readonly name: string;
  /** What a run of stages like this one folds into ("3 idle"), if any:
   * only stages with the same label fold together */
  readonly foldAs?: string;
  readonly node: React.ReactElement;
}

/** `stages` joined by arrows, wrapping as needed, ending at the store (dim
 * when the action never reached it, `stored` false). Two or more stages in
 * a row that fold alike show as one, until it's opened */
function Strip({
  className,
  label,
  stored = true,
  stages,
  children,
}: {
  className?: string;
  label: string;
  stored?: boolean;
  stages: readonly Shown[];
  /** After the store, on its line */
  children?: React.ReactNode;
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
    <div
      className={clsx(styles.pipeline, className)}
      role="group"
      aria-label={label}
    >
      {runs.flatMap(run => {
        const key = run[0].id;
        if (run.length === 1) return [<Step key={key}>{run[0].node}</Step>];
        const ids = run.map(stage => stage.id);
        const names = run.map(stage => stage.name).join(', ');
        const open = isOpen(run);
        const text = open ? 'fold' : run.length + ' ' + run[0].foldAs;
        // its own keyed slot, open or folded, so the button pressed stays
        // (and keeps focus) as its run opens, folds or changes at its end,
        // and the stages around it never move to another parent
        const fold = (
          <Step key={'fold:' + key}>
            <button
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
          </Step>
        );
        if (!open) return [fold];
        return [
          ...run.map((stage, i) => (
            <Step key={stage.id} arrow={i < run.length - 1}>
              {stage.node}
            </Step>
          )),
          fold,
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
        {children}
      </Step>
    </div>
  );
}

/** A stage and the arrow after it (none after the store, or after an open
 * run's last stage, whose fold button follows it), which wraps with it, so
 * a line never starts with one */
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
