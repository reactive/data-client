import React, { type ReactNode } from 'react';

import { findEntry, type LogEntry } from './actionLog';
import { ActionName, Time, useActions } from './actionParts';
import { kindColor } from './dom';
import type { CallerEvent, FetchReason } from './fetchCause';
import { DeclaredName, ManagerName } from './ManagerName';
import { useNavState } from './nav';
import styles from './store.module.css';

/** What each reason reads as, in the color of the change that leads to it */
const REASONS: Record<FetchReason, { label: string; color: string }> = {
  missing: { label: 'no data', color: kindColor('added') },
  invalid: { label: 'invalid', color: kindColor('invalidated') },
  stale: { label: 'stale', color: kindColor('expired') },
  error: { label: 'after error', color: kindColor('error') },
  fresh: { label: 'fresh', color: kindColor('refreshed') },
  mutation: { label: 'mutation', color: 'var(--store-type)' },
};

/** `reason`, as a pill, or `plain` text in its color */
export function ReasonTag({
  reason,
  plain,
}: {
  reason: FetchReason;
  plain?: boolean;
}) {
  const { label, color } = REASONS[reason];
  return (
    <span
      className={plain ? styles.reasonText : styles.reason}
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
  const component = fetch?.caller?.component;
  return (
    <>
      {fetch?.reason && (
        <span className={styles.rowWhy}>
          ← <ReasonTag reason={fetch.reason} plain />
          {fetch.origin ?
            <>
              {' '}
              · <ManagerName stage={fetch.origin} />
            </>
          : component && (
              <>
                {' · '}
                <DeclaredName name={component}>{`<${component}>`}</DeclaredName>
              </>
            )
          }
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
  const { history } = useActions();
  const senders = sendersOf(entries);
  if (!senders.length) return null;
  const sent = senders[0].entry;
  const cause =
    sent.causedBy === undefined ?
      undefined
    : findEntry(history.entries, sent.causedBy);
  // the event belongs to whatever ran inside it: the cause, when the fetch
  // came of a render it set off
  const event = (cause ?? sent).caller?.event;
  // an action the app sent from a handler has no sender to name beyond it
  const named = senders.some(
    ({ entry: e }) =>
      e.reason || e.origin || e.caller?.component || e.caller?.hook,
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
            {senders.map(({ entry, n }, i) => (
              <React.Fragment key={entry.seq}>
                {i > 0 && <span className={styles.dim}>, </span>}
                <Sender entry={entry} n={n} />
              </React.Fragment>
            ))}
          </WhyStep>
        )}
      </ol>
    </>
  );
}

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

/** One sender: a manager, a component (linking to its code), or the app
 * when nothing names it (the event before it says where, if any); then why
 * it fetched, with which hook, how many times */
function Sender({ entry, n }: { entry: LogEntry; n: number }) {
  const { origin, caller, reason } = entry;
  const component = caller?.component;
  return (
    <span className={styles.whySender}>
      {origin ?
        <ManagerName stage={origin} />
      : component ?
        <DeclaredName name={component}>
          <span className={styles.whyComponent}>{`<${component}>`}</span>
        </DeclaredName>
      : !caller?.event && <span className={styles.dim}>the app</span>}
      {reason && <ReasonTag reason={reason} />}
      {caller?.hook && <span className={styles.dim}>{caller.hook}</span>}
      {n > 1 && <span className={styles.dim}>×{n}</span>}
    </span>
  );
}

/** What `entries` sent with a reason or a sender the log knows (a
 * manager's other actions, its path says), one per sender and reason, with
 * how many */
function sendersOf(entries: readonly LogEntry[]) {
  const seen = new Map<string, { entry: LogEntry; n: number }>();
  for (const entry of entries) {
    const { origin, caller, reason } = entry;
    if (!reason && !caller) continue;
    const key = [
      origin?.id,
      caller?.component,
      caller?.hook,
      caller?.event?.type,
      reason,
    ].join('\0');
    const sender = seen.get(key);
    if (sender) sender.n++;
    else seen.set(key, { entry, n: 1 });
  }
  return [...seen.values()];
}
