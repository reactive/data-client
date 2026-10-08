import { actionTypes, type ActionTypes, type State } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useMemo } from 'react';

import { actionKey, type Change } from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ActionsContext,
  type Actions,
  ChangeChip,
  KeyLabel,
  TypeName,
  useActions,
} from './ActionsView';
import type { Header } from './DiveViews';
import { errorText } from './model';
import { useNav } from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import { Field, Inline } from './Value';

/** One action: what it changed, then the action itself */
export function ActionDetail({
  seq,
  header,
  onShowState,
}: {
  seq: number;
  header: Header;
  /** After switching State to just after this action */
  onShowState?: () => void;
}) {
  const { log, history, showState } = useActions();
  const entry = findEntry(history.entries, seq);
  if (!entry)
    return (
      <>
        {header(null)}
        <div className={styles.record}>
          <span className={styles.dim}>No longer in the log</span>
        </div>
      </>
    );
  const changes = log.changes(entry);
  const changed = changes.filter(c => c.kind !== 'refreshed');
  const refreshed = changes.length - changed.length;
  const { store } = entry;
  return (
    <>
      {header(null)}
      <div className={styles.record}>
        <div className={clsx(styles.detail, styles.actDetail)}>
          {store ?
            <>
              {changed.map(change => (
                <ChangeLine
                  key={change.id}
                  change={change}
                  before={log.view(store.before)}
                  after={log.view(store.after)}
                />
              ))}
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
                  onClick={() => {
                    showState(seq);
                    onShowState?.();
                  }}
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

function ChangeBody({
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
      return <span className={styles.dim}>invalid; reads of it refetch</span>;
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

/** A record's last change, linking to the action that made it (the table
 * view only: the tree view has no levels to open it in) */
export function ChangedBy({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  const nav = useNav();
  const last = useMemo(() => actions && lastChange(actions, id), [actions, id]);
  if (!nav || !last) return null;
  const { seq } = last;
  return (
    <div className={styles.field}>
      <span className={styles.key}>
        changed by<span className={styles.dim}>:</span>
      </span>
      <span>
        <button
          type="button"
          className={clsx(styles.ref, styles.countRef)}
          onClick={e => {
            e.stopPropagation();
            nav.push({ kind: 'action', seq });
          }}
        >
          <ActionCrumb seq={last.seq} />
        </button>
      </span>
    </div>
  );
}

/** The newest action (up to the one State is shown after) that changed
 * row `id` */
function lastChange({ log, history, until }: Actions, id: string) {
  const { entries } = history;
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (until !== undefined && entry.seq > until) continue;
    if (log.changes(entry).some(c => c.id === id && c.kind !== 'refreshed'))
      return entry;
  }
}

/** Breadcrumb for an action's level: `setResponse GET /posts` */
export function ActionCrumb({ seq }: { seq: number }) {
  const entry = findEntry(useActions().history.entries, seq);
  if (!entry) return <>…</>;
  return (
    <>
      <TypeName entry={entry} /> <KeyLabel value={actionKey(entry.action)} />
    </>
  );
}
