import { actionTypes, type ActionTypes, type State } from '@data-client/react';
import clsx from 'clsx';
import React, { useMemo } from 'react';

import {
  actionKey,
  touches,
  type Change,
  type ChangeKind,
} from './actionGroups';
import { isRecordChange, type LogEntry } from './actionLog';
import {
  AtMoment,
  ChangeChip,
  gapText,
  spanOf,
  useActions,
} from './actionParts';
import { EndpointBody } from './Details';
import { errorText, findRow, isEndpointRow } from './model';
import {
  ActionSpanContext,
  NavContext,
  useNav,
  type Nav,
  type View,
} from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import { Block, Field, Inline } from './Value';

/** What an action did to `subject` (every row at the store, a line saying
 * it left the subject alone, or that it is where a `gap` of dropped actions
 * changing it was found), then the action itself */
export function ActionDetail({
  entry,
  subject,
  gap,
}: {
  entry: LogEntry;
  subject: View;
  gap?: ChangeKind;
}) {
  return (
    <div className={styles.actBody}>
      <SubjectChanges entries={[entry]} subject={subject} gap={gap} />
      <div className={clsx(styles.fields, styles.metaList)}>
        <Field name="dispatchedAt" node={{ t: 'val', v: entry.at }} />
        {actionFields(entry.action).map(([name, value]) => (
          <Field key={name} name={name} node={plain(value)} />
        ))}
      </div>
    </div>
  );
}

/** What an action, or several together (a request's: its optimistic
 * update and response as one), did to `subject`: each row it changed and
 * how, from before the first to after the last */
export function SubjectChanges({
  entries,
  subject,
  gap,
}: {
  entries: readonly LogEntry[];
  subject: View;
  gap?: ChangeKind;
}) {
  const { log } = useActions();
  const changes = log.spanChanges(entries).filter(c => touches(subject, c));
  const changed = changes.filter(isRecordChange);
  const refreshed = changes.length - changed.length;
  const removed =
    subject.kind === 'record' ?
      changed.find(c => c.kind === 'removed')
    : undefined;
  const stored = entries.filter(e => e.store);
  return (
    <div className={clsx(styles.detail, styles.actDetail)}>
      {stored.length ?
        <>
          <EntryChanges entries={stored} changes={changed} />
          {removed && subject.kind === 'record' && (
            <RemovedValue
              id={subject.id}
              seq={removed.removedBy ?? stored[stored.length - 1].seq}
            />
          )}
          {refreshed > 0 && (
            <span className={styles.dim}>
              {changed.length ? 'Also stored' : 'Stored'} {refreshed} row
              {refreshed === 1 ? '' : 's'} again, unchanged
            </span>
          )}
          {gap && <span className={styles.dim}>Before it: {gapText(gap)}</span>}
          {!changes.length && !gap && (
            <span className={styles.dim}>{unchangedNote(subject)}</span>
          )}
        </>
      : <span className={styles.dim}>
          {unappliedNote(entries[entries.length - 1].action)}
        </span>
      }
    </div>
  );
}

/** The action changed nothing `subject` covers */
function unchangedNote(subject: View) {
  switch (subject.kind) {
    case 'root':
      return 'No change to the store';
    case 'list':
      return 'No change to these rows';
    default:
      return 'No change to this record';
  }
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

/** Rows the `stored` actions changed, and how */
function EntryChanges({
  entries: stored,
  changes,
}: {
  entries: readonly LogEntry[];
  changes: readonly Change[];
}) {
  const { log } = useActions();
  const before = log.view(stored[0].store!.before);
  const after = log.view(stored[stored.length - 1].store!.after);
  return (
    <ActionSpanContext.Provider value={spanOf(stored)}>
      {changes.map(change => (
        <ChangeLine
          key={change.id}
          change={change}
          before={before}
          after={after}
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
      return (
        <span className={styles.dim}>invalid; the next read refetches</span>
      );
    default:
      return <span className={styles.dim}>{change.kind}</span>;
  }
}

/** The whole record `id` as the action that removed it found it. What it
 * links to opens at that store too */
function RemovedValue({ id, seq }: { id: string; seq: number }) {
  const { then } = useActions();
  const nav = useNav()!;
  const shown = then({ seq, before: true });
  const atNav = useMemo<Nav | undefined>(
    () =>
      shown && {
        ...nav,
        model: shown.model,
        push: (view, next = { seq, before: true }) => nav.push(view, next),
      },
    [nav, shown, seq],
  );
  const row = shown && findRow(shown.model, id);
  if (!row || !atNav)
    return <span className={styles.dim}>No longer in the log</span>;
  return (
    <AtMoment then={shown}>
      <NavContext.Provider value={atNav}>
        <span className={styles.dim}>Removed; it was:</span>
        {isEndpointRow(row) ?
          <EndpointBody row={row} />
        : <Block node={row.value} />}
      </NavContext.Provider>
    </AtMoment>
  );
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
