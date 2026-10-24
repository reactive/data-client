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
  Time,
  TypeName,
  useActions,
} from './actionParts';
import { isNetworkManager, shownChain } from './attribution';
import { EndpointBody } from './Details';
import { errorText, findRow, isEndpointRow } from './model';
import {
  ActionSpanContext,
  NavContext,
  useNav,
  type Nav,
  type View,
} from './nav';
import { StepPath } from './Pipeline';
import { plain } from './refs';
import styles from './store.module.css';
import {
  Block,
  changesByField,
  Field,
  field,
  FieldChange,
  Inline,
  ValueChange,
} from './Value';

/** One action, headed as a request's view is: its step (and the way it
 * took through the managers), what it did to `subject` (every row at the
 * store, a line saying it left the subject alone, or that it is where a
 * `gap` of dropped actions changing it was found); then, only here, the
 * action itself */
export function ActionDetail({
  entry,
  subject,
  gap,
  onRequest,
}: {
  entry: LogEntry;
  subject: View;
  gap?: ChangeKind;
  /** Shows the request it is a step of, when it is one */
  onRequest?: () => void;
}) {
  // the way it took through the managers
  const chain = shownChain(useActions().history.managers);
  return (
    <div className={styles.actBody}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionLabel}>Step</h3>
        {onRequest && (
          <button
            type="button"
            className={styles.sectionLink}
            onClick={onRequest}
          >
            Its request ›
          </button>
        )}
      </div>
      <div className={styles.groupSteps}>
        <div className={styles.steps}>
          <div className={clsx(styles.row, styles.stepRow, styles.inertRow)}>
            <Time at={entry.at} />
            <TypeName entry={entry} />
          </div>
          {chain && <StepPath chain={chain} entry={entry} n={1} />}
        </div>
      </div>
      <h3 className={styles.sectionLabel}>Store changes</h3>
      <SubjectChanges entries={[entry]} subject={subject} gap={gap} />
      <h3 className={styles.sectionLabel}>Action</h3>
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
          {unappliedNote(entries[entries.length - 1])}
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
function unappliedNote({ action, consumedBy }: LogEntry) {
  // NetworkManager sets off a fetch's request (its name may end in `#2`)
  const requested = !consumedBy || isNetworkManager(consumedBy);
  if (action.type === actionTypes.FETCH && requested)
    return 'Started the request; the store changes when its response arrives';
  return consumedBy ?
      `Handled by ${consumedBy}; the store is unchanged`
    : 'Not passed on to the store (yet)';
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
      return <FieldChanges fields={change.fields ?? []} was={was} now={now} />;
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

/** Each field an update changed; one it added (missing before) or dropped
 * reads as such, as the tree marks it */
function FieldChanges({
  fields,
  was,
  now,
}: {
  fields: readonly string[];
  was: unknown;
  now: unknown;
}) {
  const before = plain(was);
  const after = plain(now);
  if (!changesByField(before, after))
    return <ValueChange was={before} now={after} />;
  return fields.map(name => (
    <div key={name} className={styles.actField}>
      <FieldChange
        name={name}
        was={field(before, name)}
        now={field(after, name)}
      />
    </div>
  ));
}

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

/** Fields the action's name already says (its type, and its key or the
 * schema standing for one) and its bookkeeping (meta) */
const NAMED = new Set(['type', 'schema', 'key', 'meta']);
/** What an action carries, at a glance: its args first, then the rest of
 * its own fields but its type, key (or schema) and meta, and an `error` it
 * didn't have */
export const whatFields = (action: ActionTypes) =>
  actionFields(action)
    .filter(([name, value]) => !NAMED.has(name) && (name !== 'error' || value))
    .sort(([a], [b]) => Number(b === 'args') - Number(a === 'args'));

/** A fetch's meta carries its promise and callbacks along with the times */
function withoutFunctions(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => typeof v !== 'function' && !(v instanceof Promise),
    ),
  );
}
