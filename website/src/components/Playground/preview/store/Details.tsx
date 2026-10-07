import { StateContext, useController } from '@data-client/react';
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

export function EndpointDetail({ row }: { row: EndpointRow }) {
  const [view, setView] = useState<'stored' | 'returns'>('stored');
  const { record } = row;
  return (
    <div className={styles.detail}>
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
      <div className={styles.metaList}>
        <Field name="key" node={{ t: 'val', v: row.key }} />
        {record?.args.length ?
          <Field name="args" node={plain(record.args)} />
        : null}
        {row.meta && <Field name="meta" node={plain(row.meta)} />}
      </div>
    </div>
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
}: {
  row: EntityRow;
  model: StoreModel;
}) {
  return (
    <div className={styles.detail}>
      <Block node={row.value} />
      <RowMeta row={row} model={model} />
    </div>
  );
}

/** When a row was fetched and what references it */
export function RowMeta({ row, model }: { row: EntityRow; model: StoreModel }) {
  const referrers = referrersOf(model, row.id);
  return (
    <div className={styles.metaList}>
      {row.meta && <Field name="meta" node={plain(row.meta)} />}
      <div className={styles.field}>
        <span className={styles.label}>used by</span>
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
    </div>
  );
}
