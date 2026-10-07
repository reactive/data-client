import clsx from 'clsx';
import React from 'react';

import { EndpointDetail, EntityDetail, Status } from './Details';
import type { EndpointRow, EntityRow, EntityTable, StoreModel } from './model';
import type { VNode } from './refs';
import {
  Chevron,
  EndpointLabel,
  GroupLabel,
  StoreSections,
  useLimitedRows,
  useRowProps,
} from './Sections';
import styles from './store.module.css';
import { groupId, useStoreUI } from './StoreUI';
import { Inline, prettyPk } from './Value';

/** Each Entity type is a table; fields that don't fit move into the row's
 * expanded detail rather than scrolling sideways */
export default function TableView({
  model,
  maxColumns,
}: {
  model: StoreModel;
  maxColumns: number;
}) {
  return (
    <StoreSections
      model={model}
      endpoints={
        <table className={styles.table}>
          <tbody>
            {model.endpoints.map(row => (
              <EndpointTableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      }
      renderTable={table => (
        <EntityGroup
          key={table.key}
          table={table}
          model={model}
          maxColumns={maxColumns}
        />
      )}
    />
  );
}

function EndpointTableRow({ row }: { row: EndpointRow }) {
  const { open, props } = useRowProps(row.id);
  return (
    <>
      <tr {...props}>
        <td className={styles.endpointCell} title={row.key}>
          <EndpointLabel row={row} open={open} />
        </td>
        <td>
          <Inline node={row.value} />
        </td>
        <td className={styles.statusCell}>
          <Status meta={row.meta} />
        </td>
      </tr>
      {open && (
        <tr className={styles.detailRow}>
          <td colSpan={3}>
            <EndpointDetail row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

const VALUE_COLUMN = '';
const pkLabel = {
  entity: 'id',
  collection: 'args',
  scalar: 'cell',
  unknown: 'key',
} as const;

function EntityGroup({
  table,
  model,
  maxColumns,
}: {
  table: EntityTable;
  model: StoreModel;
  maxColumns: number;
}) {
  const { isOpen, toggle } = useStoreUI();
  const open = isOpen(groupId(table.key));
  const { shown, footer } = useLimitedRows(table.key, table.rows);
  // Entities get a column per field that fits; other tables one value column
  const columns =
    table.kind === 'entity' ?
      table.fields.slice(0, maxColumns)
    : [VALUE_COLUMN];
  const hidden =
    table.kind === 'entity' ? table.fields.length - columns.length : 0;
  return (
    <div className={styles.group}>
      <button
        type="button"
        className={styles.groupHeader}
        aria-expanded={open}
        onClick={() => toggle(groupId(table.key))}
      >
        <GroupLabel table={table} open={open} />
        {open && hidden > 0 && (
          <span className={styles.hint}>
            +{hidden} field{hidden === 1 ? '' : 's'} when expanded
          </span>
        )}
      </button>
      {open && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  className={
                    table.kind === 'entity' ? styles.pkCell : styles.argsCell
                  }
                >
                  {pkLabel[table.kind]}
                </th>
                {columns.map(c => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(row => (
                <EntityTableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  model={model}
                />
              ))}
            </tbody>
          </table>
          {footer}
        </>
      )}
    </div>
  );
}

function EntityTableRow({
  row,
  columns,
  model,
}: {
  row: EntityRow;
  columns: readonly string[];
  model: StoreModel;
}) {
  const { open, props } = useRowProps(row.id);
  return (
    <>
      <tr {...props}>
        <td className={clsx(styles.pkCell, styles.key)}>
          <Chevron open={open} />
          {prettyPk(row.pk)}
        </td>
        {columns.map(c => {
          const node = c === VALUE_COLUMN ? row.value : field(row.value, c);
          return <td key={c}>{node && <Inline node={node} name={c} />}</td>;
        })}
      </tr>
      {open && (
        <tr className={styles.detailRow}>
          <td colSpan={columns.length + 1}>
            <EntityDetail row={row} referrers={model.referrers.get(row.id)} />
          </td>
        </tr>
      )}
    </>
  );
}

function field(node: VNode, name: string): VNode | undefined {
  if (node.t !== 'obj') return;
  return node.entries.find(([k]) => k === name)?.[1];
}
