import { StateContext, useController } from '@data-client/react';
import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useContext, useEffect, useState } from 'react';

import {
  errorText,
  referrersOf,
  type EndpointRow,
  type EntityRow,
  type StoreModel,
} from './model';
import { plain } from './refs';
import type { EndpointRecord } from './schemaRegistry';
import styles from './store.module.css';
import { Block, Field, formatTime, RefList, RowChip } from './Value';
import { ChangedBy } from './VersionHistory';

type Meta = EndpointRow['meta'];

/** fresh (with countdown), stale, error or invalidated */
export function Status({ meta }: { meta: Meta }) {
  const now = useNow(meta?.expiresAt);
  if (!meta) return null;
  if (meta.error)
    return (
      <span className={clsx(styles.pill, styles.error)}>
        <Translate id="playground.store.status.error">error</Translate>
      </span>
    );
  if (meta.invalidated)
    return (
      <span className={clsx(styles.pill, styles.stale)}>{invalidLabel()}</span>
    );
  if (!isFinite(meta.expiresAt))
    return (
      <span className={clsx(styles.pill, styles.fresh)}>
        <Translate id="playground.store.status.fresh">fresh</Translate>
      </span>
    );
  const left = meta.expiresAt - now;
  return left > 0 ?
      <span
        className={clsx(styles.pill, styles.fresh)}
        title={translate(
          {
            id: 'playground.store.status.expiresAt',
            message: 'Expires at {time}',
          },
          { time: formatTime(meta.expiresAt) },
        )}
      >
        <Translate
          id="playground.store.status.freshFor"
          values={{ left: seconds(left) }}
        >
          {'fresh {left}'}
        </Translate>
      </span>
    : <span className={clsx(styles.pill, styles.stale)}>
        <Translate id="playground.store.status.stale">stale</Translate>
      </span>;
}

/** An endpoint invalidated, or an entity `schema.Invalidate` marked */
export const invalidLabel = () =>
  translate({ id: 'playground.store.status.invalid', message: 'invalid' });

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
          label={translate({
            id: 'playground.store.record.show',
            message: 'Show',
          })}
          options={{
            stored: translate({
              id: 'playground.store.record.stored',
              message: 'Stored',
            }),
            returns: translate({
              id: 'playground.store.record.returns',
              message: 'Returns',
            }),
          }}
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
  history,
}: {
  row: EndpointRow;
  collapsed?: boolean;
  /** Whether to offer the row's history (a level header may already) */
  history?: boolean;
}) {
  const { record } = row;
  return (
    <MetaBlock collapsed={collapsed} summary={metaSummary(row.meta)}>
      <Field name="key" node={{ t: 'val', v: row.key }} />
      {record?.args.length ?
        <Field name="args" node={plain(record.args)} />
      : null}
      <MetaFields meta={row.meta} />
      <ChangedBy id={row.id} history={history} />
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
  history,
}: {
  row: EntityRow;
  model: StoreModel;
  collapsed?: boolean;
  /** Whether to offer the row's history (a level header may already) */
  history?: boolean;
}) {
  const referrers = referrersOf(model, row.id);
  const summary = metaSummary(row.meta);
  if (referrers.length)
    summary.push(
      translate(
        {
          id: 'playground.store.record.usedByCount',
          message: 'used by {count}',
        },
        { count: referrers.length },
      ),
    );
  return (
    <MetaBlock collapsed={collapsed} summary={summary}>
      <MetaFields meta={row.meta} />
      <div className={styles.field}>
        <span className={styles.key}>
          {usedBy()}
          <span className={styles.dim}>:</span>
        </span>
        {referrers.length ?
          <RefList
            chips={referrers.map(r => (
              <RowChip key={r.id} row={r} />
            ))}
            list={() => ({
              kind: 'list',
              label: usedBy(),
              ids: referrers.map(r => r.id),
            })}
          />
        : <span className={styles.dim}>
            <Translate id="playground.store.record.usedByNothing">
              nothing
            </Translate>
          </span>
        }
      </div>
      <ChangedBy id={row.id} history={history} />
    </MetaBlock>
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
        <Translate id="playground.store.record.meta">meta</Translate>
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
  const parts = [
    translate(
      { id: 'playground.store.record.fetchedAt', message: 'fetched {time}' },
      { time: formatTime(meta.fetchedAt || meta.date) },
    ),
  ];
  parts.push(
    isFinite(meta.expiresAt) ?
      translate(
        { id: 'playground.store.record.expiresAt', message: 'expires {time}' },
        { time: formatTime(meta.expiresAt) },
      )
    : translate({
        id: 'playground.store.record.neverExpires',
        message: 'never expires',
      }),
  );
  if ('error' in meta && meta.error)
    parts.push(
      translate({ id: 'playground.store.status.error', message: 'error' }),
    );
  if ('invalidated' in meta && meta.invalidated)
    parts.push(
      translate({
        id: 'playground.store.change.invalidated',
        message: 'invalidated',
      }),
    );
  return parts;
}

const usedBy = () =>
  translate({ id: 'playground.store.record.usedBy', message: 'used by' });
