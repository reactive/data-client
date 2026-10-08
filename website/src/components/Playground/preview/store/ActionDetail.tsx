import { actionTypes, type ActionTypes, type State } from '@data-client/react';
import clsx from 'clsx';
import React, { useMemo } from 'react';

import { actionKey, groupEntriesOf, type Change } from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ChangeChip,
  KeyLabel,
  spanOf,
  TypeName,
  useActions,
} from './ActionsView';
import type { Header } from './DiveViews';
import { errorText } from './model';
import { ActionSpanContext } from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import { Field, Inline } from './Value';

/** One action: what it changed, then the action itself */
export function ActionDetail({
  seq,
  header,
  onShowState,
  onStep,
}: {
  seq: number;
  header: Header;
  /** After switching State to just after this action; returns what reopens
   * this action from there */
  onShowState?: () => () => void;
  /** Shows another action of the same row in its place */
  onStep: (seq: number) => void;
}) {
  const { log, history, groups, showState } = useActions();
  const entry = findEntry(history.entries, seq);
  const row = useMemo(() => {
    const group = groups.find(g => groupEntriesOf(g).some(e => e.seq === seq));
    return group ? groupEntriesOf(group) : [];
  }, [groups, seq]);
  const step = row.length > 1 && (
    <GroupStep row={row} seq={seq} onStep={onStep} />
  );
  if (!entry)
    return (
      <>
        {header(step)}
        <div className={styles.record}>
          <span className={styles.dim}>No longer in the log</span>
        </div>
      </>
    );
  const changes = log.changes(entry);
  const changed = changes.filter(c => c.kind !== 'refreshed');
  const refreshed = changes.length - changed.length;
  return (
    <>
      {header(step)}
      <div className={styles.record}>
        <div className={clsx(styles.detail, styles.actDetail)}>
          {entry.store ?
            <>
              <EntryChanges entry={entry} changes={changed} />
              {refreshed > 0 && (
                <span className={styles.dim}>
                  {changed.length ? 'Also stored' : 'Stored'} {refreshed} row
                  {refreshed === 1 ? '' : 's'} again, unchanged
                </span>
              )}
              {!changes.length && (
                <span className={styles.dim}>No change to the store</span>
              )}
              {changes.length > 0 && (
                <button
                  type="button"
                  className={styles.showState}
                  onClick={() => showState(seq, onShowState?.())}
                >
                  View State after this
                </button>
              )}
            </>
          : <span className={styles.dim}>{unappliedNote(entry.action)}</span>}
        </div>
      </div>
      <div className={styles.levelFoot}>
        <div className={clsx(styles.fields, styles.metaList)}>
          <Field name="dispatchedAt" node={{ t: 'val', v: entry.at }} />
          {actionFields(entry.action).map(([name, value]) => (
            <Field key={name} name={name} node={plain(value)} />
          ))}
        </div>
      </div>
    </>
  );
}

/** Steps through the actions of the row this one belongs to */
function GroupStep({
  row,
  seq,
  onStep,
}: {
  row: readonly LogEntry[];
  seq: number;
  onStep: (seq: number) => void;
}) {
  const i = row.findIndex(e => e.seq === seq);
  const earlier = row[i - 1];
  const later = row[i + 1];
  return (
    <span className={styles.pager}>
      <button
        type="button"
        aria-label="Previous action in this row"
        disabled={!earlier}
        onClick={() => onStep(earlier.seq)}
      >
        ‹
      </button>
      {i + 1} of {row.length}
      <button
        type="button"
        aria-label="Next action in this row"
        disabled={!later}
        onClick={() => onStep(later.seq)}
      >
        ›
      </button>
    </span>
  );
}

/** Why an action that never reached the store is still in the log */
function unappliedNote(action: ActionTypes) {
  switch (action.type) {
    case actionTypes.FETCH:
      return 'Started the request; the store changes when its response arrives';
    case actionTypes.SUBSCRIBE:
    case actionTypes.UNSUBSCRIBE:
      return 'Handled by SubscriptionManager; the store is unchanged';
    default:
      return 'A manager handled this without passing it to the store';
  }
}

/** Rows `entry` changed, and how */
function EntryChanges({
  entry,
  changes,
}: {
  entry: LogEntry;
  changes: readonly Change[];
}) {
  const { log } = useActions();
  const { store } = entry;
  if (!store) return null;
  return (
    <ActionSpanContext.Provider value={spanOf([entry])}>
      {changes.map(change => (
        <ChangeLine
          key={change.id}
          change={change}
          before={log.view(store.before)}
          after={log.view(store.after)}
        />
      ))}
    </ActionSpanContext.Provider>
  );
}

/** A changed row and how: its new value, or each changed field */
function ChangeLine({
  change,
  before,
  after,
}: {
  change: Change;
  before: State<unknown>;
  after: State<unknown>;
}) {
  return (
    <div className={styles.actChange}>
      <span>
        <ChangeChip change={change} />
      </span>
      <div className={styles.actChangeBody}>
        <ChangeBody change={change} before={before} after={after} />
      </div>
    </div>
  );
}

export function ChangeBody({
  change,
  before,
  after,
}: {
  change: Change;
  before: State<unknown>;
  after: State<unknown>;
}) {
  if ('endpoint' in change) {
    const meta = after.meta[change.endpoint];
    switch (change.kind) {
      case 'error':
        return <span className={styles.null}>{errorText(meta?.error)}</span>;
      case 'invalidated':
        return (
          <span className={styles.dim}>invalid; the next read refetches</span>
        );
      case 'expired':
        return (
          <span className={styles.dim}>stale; the next read refetches</span>
        );
      case 'removed':
        return <span className={styles.dim}>removed</span>;
      default:
        return (
          <Inline
            node={plain(after.endpoints[change.endpoint])}
            name="response"
          />
        );
    }
  }
  const was = before.entities[change.table]?.[change.pk];
  const now = after.entities[change.table]?.[change.pk];
  switch (change.kind) {
    case 'added':
      return <Inline node={plain(now)} bare />;
    case 'updated':
      return (
        <>
          {(change.fields ?? []).map(field => (
            <div key={field} className={styles.actField}>
              <span className={styles.key}>{field}</span>
              <span className={styles.dim}>: </span>
              <span className={styles.was}>
                <Inline node={plain(get(was, field))} name={field} />
              </span>
              <span className={styles.dim}> → </span>
              <Inline node={plain(get(now, field))} name={field} />
            </div>
          ))}
        </>
      );
    case 'invalidated':
      return (
        <span className={styles.dim}>invalid; the next read refetches</span>
      );
    default:
      return <span className={styles.dim}>{change.kind}</span>;
  }
}

const get = (row: unknown, field: string) =>
  row && typeof row === 'object' ? (row as any)[field] : row;

/** The action's own fields, minus what can't be shown (the endpoint, the
 * promise callbacks in a fetch's meta) */
function actionFields(action: ActionTypes): [string, unknown][] {
  const fields: [string, unknown][] = [['type', action.type]];
  const key = actionKey(action);
  if (key && !('key' in action)) fields.push(['schema', key]);
  for (const [name, value] of Object.entries(action)) {
    if (name === 'type' || name === 'endpoint' || name === 'schema') continue;
    fields.push([name, name === 'meta' ? withoutFunctions(value) : value]);
  }
  return fields;
}

/** A fetch's meta carries its promise and callbacks along with the times */
function withoutFunctions(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => typeof v !== 'function' && !(v instanceof Promise),
    ),
  );
}

/** Breadcrumb for an action's level: `setResponse GET /posts` */
export function ActionCrumb({ seq }: { seq: number }) {
  const entry = findEntry(useActions().history.entries, seq);
  return entry ? <ActionName entry={entry} /> : <>…</>;
}

export function ActionName({ entry }: { entry: LogEntry }) {
  return (
    <>
      <TypeName entry={entry} /> <KeyLabel value={actionKey(entry.action)} />
    </>
  );
}
