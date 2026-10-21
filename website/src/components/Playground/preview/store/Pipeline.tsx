import clsx from 'clsx';
import React, { useMemo } from 'react';

import type { LogEntry } from './actionLog';
import { APP, pipeline } from './attribution';
import styles from './store.module.css';

/** Every dispatch's way to the store: the app, then each manager of the
 * chain in order, then the store. Each stage says how many actions it sent
 * and (⊘) handled without passing on; picking one (`picked`, again to let
 * go) shows only its actions */
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
  const { app, stages } = useMemo(
    () => pipeline(chain, entries),
    [chain, entries],
  );
  return (
    <Strip label="Pipeline: who sent the actions, and who handled them">
      {[{ id: APP, sent: app, handled: 0 }, ...stages].map(
        ({ id, sent, handled }) => (
          <button
            key={id}
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
      )}
    </Strip>
  );
}

/** The way `entry` took: who sent it (the app, or a manager), each manager
 * it passed, the one that handled it (⊘) and those after, which never saw
 * it, and whether it reached the store */
export function ActionPath({
  chain,
  entry: { origin = APP, consumedBy, store },
}: {
  chain: readonly string[];
  entry: LogEntry;
}) {
  const stages = [APP, ...chain];
  const stop = consumedBy ? stages.indexOf(consumedBy) : -1;
  return (
    <Strip label="Path through the managers" stored={!!store}>
      {stages.map((id, i) => (
        <span
          key={id}
          className={clsx(
            styles.stage,
            id === origin && styles.stageSender,
            i === stop && styles.stageStop,
            // the app sent nothing, and none after the stop saw it
            ((id === APP && origin !== APP) || (stop >= 0 && i > stop)) &&
              styles.stageOff,
          )}
        >
          {id}
          {id === origin && id !== APP && (
            <span className={styles.stageNote}>↑ sent it</span>
          )}
          {i === stop && <span className={styles.stageNote}>⊘ handled it</span>}
        </span>
      ))}
    </Strip>
  );
}

/** Stages joined by arrows, wrapping as needed, ending at the store (dim
 * when the action never reached it, `stored` false) */
function Strip({
  label,
  stored = true,
  children,
}: {
  label: string;
  stored?: boolean;
  children: React.ReactElement[];
}) {
  const end = (
    <span
      // apart from the stages, whose keys are names (never with a space)
      key=" store"
      className={clsx(
        styles.stage,
        styles.stageEnd,
        !stored && styles.stageOff,
      )}
    >
      store
    </span>
  );
  // each arrow wraps with the stage it leaves, so a line never starts with one
  const stages = [...children, end];
  return (
    <div className={styles.pipeline} role="group" aria-label={label}>
      {stages.map((stage, i) => (
        <span key={stage.key} className={styles.stageStep}>
          {stage}
          {i < stages.length - 1 && (
            <span className={styles.stageArrow} aria-hidden>
              →
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
