import { actionTypes } from '@data-client/react';
import React, { useContext, useMemo, type ReactNode } from 'react';

import type { LogEntry } from './actionLog';
import { ActionName, Time, useActions } from './actionParts';
import { stageName } from './attribution';
import type { Caller, CallerEvent, FetchReason } from './fetchCause';
import { ManagerName } from './ManagerName';
import { useNavState } from './nav';
import styles from './store.module.css';
import { CodeOpenerContext } from '../../editor/openCode';

/** What each reason reads as, and its color (a change's, see
 * `CHANGE_KINDS`) */
const REASONS: Record<FetchReason, { label: string; color: string }> = {
  missing: { label: 'no data', color: 'var(--store-kind-added)' },
  invalid: { label: 'invalid', color: 'var(--store-kind-invalidated)' },
  stale: { label: 'stale', color: 'var(--store-kind-expired)' },
  error: { label: 'after error', color: 'var(--store-kind-error)' },
  fresh: { label: 'fresh', color: 'var(--store-dim)' },
  mutation: { label: 'mutation', color: 'var(--store-type)' },
};

export function ReasonTag({ reason }: { reason: FetchReason }) {
  const { label, color } = REASONS[reason];
  return (
    <span
      className={styles.reason}
      style={{ '--reason': color } as React.CSSProperties}
    >
      {label}
    </span>
  );
}

/** A row's why, after what it changed: the reason its first fetch went
 * out and who sent it (`← invalid · <ShowTime>`), and how many fetches it
 * caused (`→ 1 refetch`) */
export function RowWhy({
  entries,
  refetches,
}: {
  entries: readonly LogEntry[];
  refetches: number;
}) {
  const fetch = entries.find(e => e.reason);
  const sender =
    fetch?.origin ? stageName(fetch.origin)
    : fetch?.caller?.component ? `<${fetch.caller.component}>`
    : undefined;
  return (
    <>
      {fetch?.reason && (
        <span className={styles.rowWhy}>
          ←{' '}
          <span style={{ color: REASONS[fetch.reason].color }}>
            {REASONS[fetch.reason].label}
          </span>
          {sender && <> · {sender}</>}
        </span>
      )}
      {refetches > 0 && (
        <span className={styles.rowWhy}>
          → {refetches} refetch{refetches === 1 ? '' : 'es'}
        </span>
      )}
    </>
  );
}

/** Why `entries` (one action, or a request's) were sent, root first: the
 * user event that started it, the action that left the data invalid or
 * stale, then who fetched and why. Nothing for actions the log knows no
 * reason or sender for */
export function Why({ entries }: { entries: readonly LogEntry[] }) {
  const { log, history } = useActions();
  const sent = entries.find(isSent);
  const cause = useMemo(
    () => sent && log.causeOf(history.entries, sent),
    [log, history.entries, sent],
  );
  if (!sent) return null;
  // the event belongs to whatever ran inside it: the cause, when the fetch
  // came of a render it set off
  const event = (cause ?? sent).caller?.event;
  // an action the app sent from a handler has no sender to name beyond it
  const named = entries.some(
    e => e.reason || e.origin || e.caller?.component || e.caller?.hook,
  );
  return (
    <>
      <h3 className={styles.sectionLabel}>Why</h3>
      <ol className={styles.why}>
        {event && (
          <WhyStep root>
            <EventName event={event} />
          </WhyStep>
        )}
        {cause && (
          <WhyStep at={cause}>
            <CauseLink entry={cause} />
          </WhyStep>
        )}
        {named && (
          <WhyStep>
            <Sender entries={entries} />
          </WhyStep>
        )}
      </ol>
    </>
  );
}

/** One the log knows why it was sent: a fetch, or one the app sent from a
 * hook or a user event (a manager's other actions, its path says) */
const isSent = (entry: LogEntry) => !!(entry.reason || entry.caller);

function WhyStep({
  root,
  at,
  children,
}: {
  root?: boolean;
  at?: LogEntry;
  children: ReactNode;
}) {
  return (
    <li className={styles.whyStep} data-root={root || undefined}>
      <span className={styles.whyWhat}>{children}</span>
      {at && <Time at={at.at} />}
    </li>
  );
}

function EventName({ event }: { event: CallerEvent }) {
  return (
    <>
      <span className={styles.whyEvent}>{event.type}</span>
      {event.target && <span className={styles.dim}> “{event.target}”</span>}
    </>
  );
}

/** The action that caused it, opening it */
function CauseLink({ entry }: { entry: LogEntry }) {
  const { show } = useNavState();
  return (
    <button
      type="button"
      className={styles.whyLink}
      title="Show this action"
      onClick={() => show(entry.seq, 'action')}
    >
      <ActionName entry={entry} />
    </button>
  );
}

/** Who sent `entries` and, a fetch, why: each distinct sender once, with
 * how many of the request's fetches it sent */
function Sender({ entries }: { entries: readonly LogEntry[] }) {
  const senders = useMemo(() => sendersOf(entries), [entries]);
  return (
    <>
      {senders.map(({ entry, n }, i) => (
        <React.Fragment key={entry.seq}>
          {i > 0 && <span className={styles.dim}>, </span>}
          {entry.origin ?
            <ManagerName stage={entry.origin} />
          : <CallerName caller={entry.caller} />}
          {entry.reason && (
            <>
              {entry.origin || entry.caller?.component || !entry.caller ?
                ' '
              : null}
              <ReasonTag reason={entry.reason} />
            </>
          )}
          {entry.caller?.hook && (
            <span className={styles.dim}> {entry.caller.hook}</span>
          )}
          {n > 1 && <span className={styles.dim}> ×{n}</span>}
        </React.Fragment>
      ))}
    </>
  );
}

/** Fetches `entries` holds, one per sender and reason, with how many */
function sendersOf(entries: readonly LogEntry[]) {
  const seen = new Map<string, { entry: LogEntry; n: number }>();
  for (const entry of entries) {
    if (entries.length > 1 && entry.action.type !== actionTypes.FETCH) continue;
    if (!isSent(entry)) continue;
    const { origin, caller, reason } = entry;
    const key = JSON.stringify([
      origin?.id,
      caller?.component,
      caller?.hook,
      caller?.event?.type,
      reason,
    ]);
    const sender = seen.get(key);
    if (sender) sender.n++;
    else seen.set(key, { entry, n: 1 });
  }
  return [...seen.values()];
}

/** A component, linking to where the code declares it; else the event, or
 * the app */
function CallerName({ caller }: { caller?: Caller }) {
  const opener = useContext(CodeOpenerContext);
  const component = caller?.component;
  // sent from a handler: the event before it says where
  if (!component)
    return caller?.event ? null : <span className={styles.dim}>the app</span>;
  const target = opener?.declared.get(component);
  const name = `<${component}>`;
  if (!opener || !target)
    return <span className={styles.whyComponent}>{name}</span>;
  return (
    <button
      type="button"
      className={styles.whyLink}
      title={`Open ${component} in the code`}
      onClick={() => opener.open(target)}
    >
      <span className={styles.whyComponent}>{name}</span>
    </button>
  );
}
