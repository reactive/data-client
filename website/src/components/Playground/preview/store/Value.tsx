import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useContext, useState } from 'react';

import { fitChips, INLINE_LIMIT, isTimeField } from './columns';
import { entityId, isEndpointRow, prettyPk, type AnyRow } from './model';
import {
  ActionSpanContext,
  refsList,
  useNav,
  type ListView,
  type Moment,
  type View,
} from './nav';
import {
  CIRCULAR,
  INVALIDATED,
  isRefList,
  temporalType,
  type RefNode,
  type VNode,
} from './refs';
import styles from './store.module.css';
import { useStoreUI } from './StoreUI';

/** Fields a bare preview shows (the row truncates long before) */
const BARE_LIMIT = 20;
/** Items shown before a "N more" button in expanded values */
const BLOCK_LIMIT = 20;
/** Refs listed in a record before a count chip that dives into all of them */
const RECORD_REFS = 10;

export function RefChip({
  id,
  label,
  className,
  title,
  at,
}: {
  id: string;
  label: React.ReactNode;
  className?: string;
  title?: string;
  /** The store the record shows; by default as the actions this chip
   * summarizes left it */
  at?: Moment;
}) {
  const { reveal } = useStoreUI();
  const nav = useNav();
  const spanAt = useSpanEnd();
  return (
    <button
      type="button"
      className={clsx(styles.ref, className)}
      title={title}
      onClick={e => {
        e.stopPropagation();
        if (nav) nav.push({ kind: 'record', id }, at ?? spanAt);
        else reveal(id);
      }}
    >
      {label}
    </button>
  );
}

/** `GET /posts` */
export function EndpointKey({
  method,
  path,
}: {
  method: string;
  path: string;
}) {
  return (
    <>
      <span className={styles.method}>{method}</span> {path}
    </>
  );
}

/** `Post 1` */
export function EntityKey({ table, pk }: { table: string; pk: string }) {
  return (
    <>
      {table} <b>{prettyPk(pk)}</b>
    </>
  );
}

/** The key of any row: `GET /posts` or `Post 1` */
export function RowKey({ row }: { row: AnyRow }) {
  return isEndpointRow(row) ?
      <EndpointKey method={row.method} path={row.path} />
    : <EntityKey table={row.table} pk={row.pk} />;
}

/** A chip for any row, endpoint or stored */
export function RowChip({ row }: { row: AnyRow }) {
  return (
    <RefChip
      id={row.id}
      className={isEndpointRow(row) ? styles.endpointRef : undefined}
      label={<RowKey row={row} />}
    />
  );
}

/** Dives into the rest: `+79`, or `Comment · 80` when none fit */
export function CountChip({
  list,
  children,
  className = styles.countRef,
}: {
  list: () => View;
  children: React.ReactNode;
  className?: string;
}) {
  const nav = useNav();
  const at = useSpanEnd();
  return (
    <button
      type="button"
      className={clsx(styles.ref, className)}
      onClick={e => {
        e.stopPropagation();
        nav?.push(list(), at);
      }}
    >
      {children}
    </button>
  );
}

/** The first `RECORD_REFS` chips; the table view dives into the rest */
export function RefList({
  chips,
  list,
}: {
  chips: readonly React.ReactNode[];
  list: () => ListView;
}) {
  const nav = useNav();
  const cut = nav && chips.length > RECORD_REFS;
  return (
    <span className={styles.wrapList}>
      {cut ? chips.slice(0, RECORD_REFS) : chips}
      {cut && <CountChip list={list}>+{chips.length - RECORD_REFS}</CountChip>}
    </span>
  );
}

/** Table cell: lists of refs show the chips that fit in `width`, then a
 * count chip for the rest */
export function Cell({
  node,
  name,
  width,
  dive,
}: {
  node: VNode;
  name: string;
  width: number;
  /** Where the count chip goes (nav's `cellDive`) */
  dive: (items: readonly RefNode[]) => View;
}) {
  if (!isRefList(node)) return <Inline node={node} name={name} />;
  const { items } = node;
  // a lone chip shows (truncated if it must) rather than a count of one
  const fit = Math.max(fitChips(items, width), items.length === 1 ? 1 : 0);
  const list = () => dive(items);
  if (!fit)
    return (
      <CountChip list={list}>
        {items[0].key} · {items.length}
      </CountChip>
    );
  return (
    <Inline
      node={node}
      limit={fit}
      shrink
      more={<CountChip list={list}>+{items.length - fit}</CountChip>}
    />
  );
}

/** Single-line summary for table cells and tree rows */
export function Inline({
  node,
  name,
  bare = false,
  limit = INLINE_LIMIT,
  more,
  shrink = false,
}: {
  node: VNode;
  name?: string;
  /** Top-level object without braces, its first BARE_LIMIT fields */
  bare?: boolean;
  /** Array items shown */
  limit?: number;
  /** Stands for the items past `limit` (default: a dim `+N`) */
  more?: React.ReactNode;
  /** A list's chips shrink (truncating their pk) to fit its cell */
  shrink?: boolean;
}) {
  switch (node.t) {
    case 'ref':
      return (
        <RefChip
          id={entityId(node.key, node.pk)}
          label={<EntityKey table={node.key} pk={node.pk} />}
        />
      );
    case 'val':
      return <Primitive value={node.v} name={name} />;
    case 'arr': {
      const shown = node.items.slice(0, limit);
      const rest = node.items.length - shown.length;
      return (
        <span className={clsx(styles.inlineList, shrink && styles.shrinkList)}>
          <span className={styles.dim}>[</span>
          {shown.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className={styles.dim}>, </span>}
              <Inline node={item} />
            </React.Fragment>
          ))}
          {rest > 0 && (
            <>
              <span className={styles.dim}>, </span>
              {more ?? <span className={styles.dim}>+{rest}</span>}
            </>
          )}
          <span className={styles.dim}>]</span>
        </span>
      );
    }
    case 'obj': {
      const shown = node.entries.slice(0, bare ? BARE_LIMIT : 2);
      const rest = node.entries.length - shown.length;
      return (
        <span className={styles.inlineList}>
          {!bare && <span className={styles.dim}>{'{'}</span>}
          {shown.map(([k, v], i) => (
            <React.Fragment key={k}>
              {i > 0 && <span className={styles.dim}>, </span>}
              <span className={styles.key}>{k}</span>
              <span className={styles.dim}>: </span>
              <Inline node={v} name={k} />
            </React.Fragment>
          ))}
          {rest > 0 && <span className={styles.dim}>, +{rest}</span>}
          {!bare && <span className={styles.dim}>{'}'}</span>}
        </span>
      );
    }
  }
}

/** Full value: nested objects indent, long lists show more on request */
export function Block({ node, name }: { node: VNode; name?: string }) {
  if (node.t === 'obj') {
    if (!node.entries.length) return <span className={styles.dim}>{'{}'}</span>;
    return (
      <div className={styles.fields}>
        {node.entries.map(([k, v]) => (
          <Field key={k} name={k} node={v} />
        ))}
      </div>
    );
  }
  if (node.t === 'arr') return <BlockList node={node} name={name} />;
  return <Inline node={node} name={name} />;
}

export function Field({ name, node }: { name: string; node: VNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.key}>
        {name}
        <span className={styles.dim}>:</span>
      </span>
      <Block node={node} name={name} />
    </div>
  );
}

function BlockList({
  node,
  name = 'items',
}: {
  node: Extract<VNode, { t: 'arr' }>;
  name?: string;
}) {
  const [all, setAll] = useState(false);
  const nav = useNav();
  // the table view dives into long lists of refs instead of growing them
  if (nav && isRefList(node))
    return (
      <RefList
        chips={node.items.map((item, i) => (
          <Inline key={i} node={item} />
        ))}
        list={() => refsList(node.items, name)}
      />
    );
  const shown = all ? node.items : node.items.slice(0, BLOCK_LIMIT);
  const rest = node.items.length - shown.length;
  const more =
    rest > 0 ?
      <button
        type="button"
        className={styles.more}
        onClick={e => {
          e.stopPropagation();
          setAll(true);
        }}
      >
        {moreLabel(rest)}
      </button>
    : null;
  if (!node.items.length) return <span className={styles.dim}>[]</span>;
  // Objects get one indexed block each; refs and primitives wrap inline
  if (node.items.some(i => i.t === 'obj'))
    return (
      <div className={styles.fields}>
        {shown.map((item, i) => (
          <Field key={i} name={`${i}`} node={item} />
        ))}
        {more}
      </div>
    );
  return (
    <span className={styles.wrapList}>
      {shown.map((item, i) => (
        <Inline key={i} node={item} />
      ))}
      {more}
    </span>
  );
}

export function Primitive({ value, name }: { value: unknown; name?: string }) {
  if (value === CIRCULAR) return <span className={styles.dim}>[Circular]</span>;
  if (value === INVALIDATED)
    return (
      <span className={clsx(styles.pill, styles.invalidated)}>
        {invalidLabel()}
      </span>
    );
  if (value === null || value === undefined)
    return <span className={styles.null}>{String(value)}</span>;
  if (typeof value === 'string')
    return <span className={styles.string}>{JSON.stringify(value)}</span>;
  if (typeof value === 'number' && value && name && isTimeField(name))
    return (
      <span className={styles.number} title={String(value)}>
        {formatTime(value)}
      </span>
    );
  if (value instanceof Date)
    return (
      <span className={styles.number} title={String(value)}>
        {isNaN(value.getTime()) ? 'Invalid Date' : dateFormatter.format(value)}
      </span>
    );
  if (typeof value === 'object' && temporalType(value))
    return (
      <span className={styles.number} title={String(value)}>
        {formatTemporal(value)}
      </span>
    );
  if (typeof value === 'object')
    return <span className={styles.dim}>{JSON.stringify(value)}</span>;
  return <span className={styles.number}>{String(value)}</span>;
}

const timeFormatter = Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
});

const dateFormatter = Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

/** An instant like a Date; other kinds (a plain date, a duration) as the
 * locale writes them, or their ISO string where it can't */
function formatTemporal(value: object) {
  const { epochMilliseconds } = value as { epochMilliseconds?: unknown };
  if (
    temporalType(value) === 'Temporal.Instant' &&
    typeof epochMilliseconds === 'number'
  )
    return dateFormatter.format(epochMilliseconds);
  try {
    return (value as Date).toLocaleString('en-US');
  } catch {
    return String(value);
  }
}

export function formatTime(ms: number) {
  if (!isFinite(ms)) return String(ms);
  return timeFormatter.format(ms);
}

/** The store as the actions chips summarize left it, if they summarize any */
function useSpanEnd(): Moment | undefined {
  const span = useContext(ActionSpanContext);
  return span && { seq: span.last };
}

/** `5 more`: rows a table leaves to its own level */
export const moreLabel = (count: number) =>
  translate(
    { id: 'playground.store.table.more', message: '{count} more' },
    { count: count.toLocaleString() },
  );

/** An endpoint invalidated, or an entity `schema.Invalidate` marked */
export const invalidLabel = () =>
  translate({ id: 'playground.store.status.invalid', message: 'invalid' });
