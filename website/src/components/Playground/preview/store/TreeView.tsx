import React from 'react';

import { EndpointDetail, EntityDetail, Status } from './Details';
import {
  prettyPk,
  type EndpointRow,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import {
  Chevron,
  EndpointLabel,
  GroupLabel,
  StoreSections,
  useLimitedRows,
  useRowProps,
} from './Sections';
import styles from './store.module.css';
import { groupId } from './StoreUI';
import { Inline } from './Value';

/** Explorer: one line per row with a preview of its fields */
export default function TreeView({ model }: { model: StoreModel }) {
  return (
    <StoreSections
      model={model}
      endpoints={model.endpoints.map(row => (
        <EndpointTreeRow key={row.id} row={row} />
      ))}
      renderTable={table => (
        <EntityTreeGroup key={table.key} table={table} model={model} />
      )}
    />
  );
}

function EndpointTreeRow({ row }: { row: EndpointRow }) {
  const { open, props } = useRowProps(row.id);
  return (
    <>
      <div {...props} title={row.key}>
        <EndpointLabel row={row} open={open} />
        <Status meta={row.meta} />
      </div>
      {open && <EndpointDetail row={row} />}
    </>
  );
}

function EntityTreeGroup({
  table,
  model,
}: {
  table: EntityTable;
  model: StoreModel;
}) {
  const { open, props } = useRowProps(groupId(table.key));
  const { shown, footer } = useLimitedRows(table.key, table.rows);
  return (
    <>
      <div {...props}>
        <GroupLabel table={table} open={open} />
      </div>
      {open && (
        <div className={styles.indent}>
          {shown.map(row => (
            <EntityTreeRow key={row.id} row={row} model={model} />
          ))}
          {footer}
        </div>
      )}
    </>
  );
}

function EntityTreeRow({ row, model }: { row: EntityRow; model: StoreModel }) {
  const { open, props } = useRowProps(row.id);
  const preview =
    row.value.t === 'obj' ?
      { ...row.value, entries: row.value.entries.filter(([k]) => k !== 'id') }
    : row.value;
  return (
    <>
      <div {...props}>
        <Chevron open={open} />
        <span className={styles.key}>{prettyPk(row.pk)}</span>
        <span className={styles.trunc}>
          <Inline node={preview} bare />
        </span>
      </div>
      {open && (
        <div className={styles.indent}>
          <EntityDetail row={row} model={model} />
        </div>
      )}
    </>
  );
}
