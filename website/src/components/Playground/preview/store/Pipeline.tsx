import clsx from 'clsx';
import React, { useMemo } from 'react';

import type { LogEntry } from './actionLog';
import { TypeName } from './actionParts';
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
  const stages = useMemo(() => pipeline(chain, entries), [chain, entries]);
  return (
    <Strip label="Pipeline: who sent the actions, and who handled them">
      {stages.map(({ id, sent, handled }) => (
        <button
          key={id}
          type="button"
          className={styles.stage}
          aria-pressed={picked === id}
          onClick={() => onPick(picked === id ? null : id)}
        >
          {id}
          <span className={sent ? styles.number : styles.dim}>{sent}</span>
          {handled > 0 && <span className={styles.stageNote}>⊘ {handled}</span>}
        </button>
      ))}
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
  const routes = useMemo(() => {
    const seen = new Map<string, { entry: LogEntry; n: number }>();
    for (const entry of entries) {
      const { action, origin, consumedBy, store } = entry;
      const key = [action.type, origin, consumedBy, !!store].join(' ');
      const route = seen.get(key);
      if (route) route.n++;
      else seen.set(key, { entry, n: 1 });
    }
    return [...seen.values()];
  }, [entries]);
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
  return (
    <div className={styles.pipeline} role="group" aria-label={label}>
      {children.map(stage => (
        // each arrow wraps with the stage it leaves, so a line never starts
        // with one
        <span key={stage.key} className={styles.stageStep}>
          {stage}
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
    </div>
  );
}
