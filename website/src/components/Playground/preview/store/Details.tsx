import { StateContext, useController } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useEffect, useState } from 'react';

import {
  isEndpointId,
  type EndpointRow,
  type EntityRow,
  type Referrer,
} from './model';
import { plain } from './refs';
import type { EndpointRecord } from './schemaRegistry';
import { Segmented } from './Sections';
import styles from './store.module.css';
import { Block, Field, formatTime, RefChip } from './Value';

type Meta = EndpointRow['meta'];

/** fresh (with countdown), stale, error or invalidated */
export function Status({ meta }: { meta: Meta }) {
  const now = useNow(meta?.expiresAt);
  if (!meta) return null;
  if (meta.error)
    return <span className={clsx(styles.pill, styles.error)}>error</span>;
  if (meta.invalidated)
    return <span className={clsx(styles.pill, styles.stale)}>invalid</span>;
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
    if (until === undefined || until <= Date.now()) return;
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

/** What useSuspense() hands the component for this endpoint */
function Returns({ record }: { record: EndpointRecord }) {
  const controller = useController();
  const state = useContext(StateContext);
  let data: unknown;
  try {
    data = controller.getResponse(record.endpoint, ...record.args, state).data;
  } catch (e) {
    data = e instanceof Error ? e.message : e;
  }
  return <Block node={plain(data)} />;
}

export function EntityDetail({
  row,
  referrers,
}: {
  row: EntityRow;
  referrers: readonly Referrer[] | undefined;
}) {
  return (
    <div className={styles.detail}>
      <Block node={row.value} />
      <div className={styles.metaList}>
        {row.meta && <Field name="meta" node={plain(row.meta)} />}
        <ReferencedBy referrers={referrers} />
      </div>
    </div>
  );
}

function ReferencedBy({
  referrers,
}: {
  referrers: readonly Referrer[] | undefined;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>used by</span>
      {referrers?.length ?
        <span className={styles.wrapList}>
          {referrers.map(r => (
            <RefChip
              key={r.id}
              id={r.id}
              label={r.label}
              className={isEndpointId(r.id) ? styles.endpointRef : undefined}
            />
          ))}
        </span>
      : <span className={styles.dim}>nothing</span>}
    </div>
  );
}
