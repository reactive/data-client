import { StateContext, useController } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import { ActionName } from './ActionDetail';
import { rowTimeline } from './actionGroups';
import { ActionsContext, type Actions } from './ActionsView';
import { focusLevel } from './dom';
import {
  errorText,
  referrersOf,
  type EndpointRow,
  type EntityRow,
  type StoreModel,
} from './model';
import { useNavState } from './nav';
import { plain } from './refs';
import type { EndpointRecord } from './schemaRegistry';
import styles from './store.module.css';
import { Block, Field, formatTime, RefList, RowChip } from './Value';

type Meta = EndpointRow['meta'];

/** fresh (with countdown), stale, error or invalidated */
export function Status({ meta }: { meta: Meta }) {
  const now = useNow(meta?.expiresAt);
  if (!meta) return null;
  if (meta.error)
    return <span className={clsx(styles.pill, styles.error)}>error</span>;
  if (meta.invalidated)
    return <span className={clsx(styles.pill, styles.stale)}>invalid</span>;
  if (!isFinite(meta.expiresAt))
    return <span className={clsx(styles.pill, styles.fresh)}>fresh</span>;
  const left = meta.expiresAt - now;
  return left > 0 ?
      <span
        className={clsx(styles.pill, styles.fresh)}
        title={`Expires at ${formatTime(meta.expiresAt)}`}
      >
        fresh {seconds(left)}
      </span>
    : <span className={clsx(styles.pill, styles.stale)}>stale</span>;
}

/** Re-renders each second until `until` passes */
function useNow(until: number | undefined) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // a new deadline may already have passed
    setNow(Date.now());
    if (until === undefined || !isFinite(until) || until <= Date.now()) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return now;
}

const seconds = (ms: number) =>
  ms < 60_000 ? `${Math.ceil(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`;

export function EndpointDetail({
  row,
  collapsedMeta,
}: {
  row: EndpointRow;
  /** Meta behind a disclosure (the tree view) instead of always shown */
  collapsedMeta?: boolean;
}) {
  return (
    <div className={styles.detail}>
      <EndpointBody row={row} />
      <EndpointMeta row={row} collapsed={collapsedMeta} />
    </div>
  );
}

/** An endpoint's stored value, or what useSuspense() returns for it */
export function EndpointBody({ row }: { row: EndpointRow }) {
  const [view, setView] = useState<'stored' | 'returns'>('stored');
  const { record } = row;
  return (
    <>
      {record && (
        <Segmented
          label="Show"
          options={{ stored: 'Stored', returns: 'Returns' }}
          value={view}
          onChange={setView}
        />
      )}
      {view === 'returns' && record ?
        <Returns record={record} />
      : <Block node={row.value} />}
    </>
  );
}

/** An endpoint's key, args and fetch meta */
export function EndpointMeta({
  row,
  collapsed,
}: {
  row: EndpointRow;
  collapsed?: boolean;
}) {
  const { record } = row;
  return (
    <MetaBlock collapsed={collapsed} summary={metaSummary(row.meta)}>
      <Field name="key" node={{ t: 'val', v: row.key }} />
      {record?.args.length ?
        <Field name="args" node={plain(record.args)} />
      : null}
      <MetaFields meta={row.meta} />
      <ChangedBy id={row.id} />
    </MetaBlock>
  );
}

function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<V, string>;
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <div className={styles.seg} role="group" aria-label={label}>
      {(Object.keys(options) as V[]).map(v => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={e => {
            e.stopPropagation();
            onChange(v);
          }}
        >
          {options[v]}
        </button>
      ))}
    </div>
  );
}

/** What useSuspense() hands the component for this endpoint */
function Returns({ record }: { record: EndpointRecord }) {
  const controller = useController();
  const state = useContext(StateContext);
  let data: unknown;
  try {
    data = controller.getResponse(record.endpoint, ...record.args, state).data;
  } catch (e) {
    data = errorText(e);
  }
  return <Block node={plain(data)} />;
}

export function EntityDetail({
  row,
  model,
  collapsedMeta,
}: {
  row: EntityRow;
  model: StoreModel;
  /** Meta behind a disclosure (the tree view) instead of always shown */
  collapsedMeta?: boolean;
}) {
  return (
    <div className={styles.detail}>
      <Block node={row.value} />
      <RowMeta row={row} model={model} collapsed={collapsedMeta} />
    </div>
  );
}

/** When a row was fetched and what references it */
export function RowMeta({
  row,
  model,
  collapsed,
}: {
  row: EntityRow;
  model: StoreModel;
  collapsed?: boolean;
}) {
  const referrers = referrersOf(model, row.id);
  const summary = metaSummary(row.meta);
  if (referrers.length) summary.push(`used by ${referrers.length}`);
  return (
    <MetaBlock collapsed={collapsed} summary={summary}>
      <MetaFields meta={row.meta} />
      <div className={styles.field}>
        <span className={styles.key}>
          used by<span className={styles.dim}>:</span>
        </span>
        {referrers.length ?
          <RefList
            chips={referrers.map(r => (
              <RowChip key={r.id} row={r} />
            ))}
            list={() => ({
              kind: 'list',
              label: 'used by',
              ids: referrers.map(r => r.id),
            })}
          />
        : <span className={styles.dim}>nothing</span>}
      </div>
      <ChangedBy id={row.id} />
    </MetaBlock>
  );
}

/** A record's last change as of the store this level shows, opening the
 * Action facet on the action that made it; or that actions the log dropped
 * made it. Nothing while the log has no change to the record */
export function ChangedBy({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  return actions ? <LastChange id={id} actions={actions} /> : null;
}

function LastChange({ id, actions }: { id: string; actions: Actions }) {
  const { log, history, until } = actions;
  const { set, setFacet } = useNavState();
  const items = useMemo(
    () => rowTimeline(log, history.entries, id),
    [log, history.entries, id],
  );
  // the latest change at or before the moment, unless actions the log
  // dropped changed the record since: no kept action made the value shown.
  // Live, the latest kept one, unless there is none
  const last =
    until === undefined ?
      (items.findLast(i => i.kind === 'version') ?? items.at(-1))
    : items.findLast(
        i => (i.kind === 'version' ? i.entry.seq : i.seq) <= until,
      );
  if (!last) return null;
  return (
    <div className={styles.field}>
      <span className={styles.key}>
        changed by<span className={styles.dim}>:</span>
      </span>
      <span className={styles.changedBy}>
        {last.kind === 'version' ?
          <button
            type="button"
            className={clsx(styles.ref, styles.countRef)}
            onClick={e => {
              e.stopPropagation();
              // the facet swaps this button out from under focus
              focusLevel(e.currentTarget);
              set(last.entry.seq);
              setFacet('action');
            }}
          >
            <ActionName entry={last.entry} />
          </button>
        : <span className={styles.dim}>actions not kept</span>}
      </span>
    </div>
  );
}

/** The quieter rows below a record's data: always shown, or (`collapsed`)
 * behind a `meta` disclosure that sums them up on one line */
function MetaBlock({
  collapsed,
  summary,
  children,
}: {
  collapsed?: boolean;
  summary: readonly string[];
  children: React.ReactNode;
}) {
  const list = (
    <div className={clsx(styles.fields, styles.metaList)}>{children}</div>
  );
  if (!collapsed) return list;
  return (
    <details className={styles.metaDetails}>
      <summary>
        <span className={styles.chevron}>▶</span>
        meta
        <span className={styles.metaSummary}>{summary.join(' · ')}</span>
      </summary>
      {list}
    </details>
  );
}

/** One row per meta field: fetchedAt, date, expiresAt, error... */
function MetaFields({ meta }: { meta: Meta | EntityRow['meta'] }) {
  const node = plain(meta);
  if (node.t !== 'obj') return null;
  return node.entries.map(([k, v]) => <Field key={k} name={k} node={v} />);
}

/** `fetched 12:11:13.045 PM · expires 12:12:13.045 PM · error` */
function metaSummary(meta: Meta | EntityRow['meta']) {
  if (!meta) return [];
  const parts = [`fetched ${formatTime(meta.fetchedAt || meta.date)}`];
  parts.push(
    isFinite(meta.expiresAt) ?
      `expires ${formatTime(meta.expiresAt)}`
    : 'never expires',
  );
  if ('error' in meta && meta.error) parts.push('error');
  if ('invalidated' in meta && meta.invalidated) parts.push('invalidated');
  return parts;
}
