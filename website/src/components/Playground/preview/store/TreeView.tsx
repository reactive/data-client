import clsx from 'clsx';
import React, { useContext } from 'react';

import { EndpointDetail, EntityDetail, Status } from './Details';
import { onActivateKey } from './dom';
import {
  optimisticId,
  prettyPk,
  splitKey,
  type EndpointRow,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { DiffContext } from './nav';
import { plain, type VNode } from './refs';
import {
  Chevron,
  GroupLabel,
  Internals,
  SectionBlock,
  useShownSections,
} from './Sections';
import styles from './store.module.css';
import {
  groupId,
  ROW_LIMIT,
  sectionId,
  showAllId,
  useStoreUI,
} from './StoreUI';
import {
  CellChange,
  EndpointKey,
  Field,
  field,
  FieldChange,
  Inline,
} from './Value';

/** Explorer: one line per row with a preview of its fields */
export default function TreeView({ model }: { model: StoreModel }) {
  return (
    <StoreSections
      model={model}
      endpoints={<EndpointTreeRows rows={model.endpoints} />}
      renderTable={table => (
        <EntityTreeGroup key={table.key} table={table} model={model} />
      )}
    />
  );
}

/** The same sections as the table view; only how rows lay out differs */
function StoreSections({
  model,
  endpoints,
  renderTable,
}: {
  model: StoreModel;
  endpoints: React.ReactNode;
  renderTable: (table: EntityTable) => React.ReactNode;
}) {
  const shown = useShownSections(model);
  return (
    <>
      <OptimisticSection model={model} />
      {shown.endpoints && (
        <Section
          name="endpoints"
          title="Endpoints"
          count={model.endpoints.length}
        >
          {endpoints}
        </Section>
      )}
      {shown.entities && (
        <Section name="entities" title="Entities" count={shown.entityCount}>
          {model.tables.map(renderTable)}
        </Section>
      )}
      {shown.internals && <InternalsSection model={model} />}
    </>
  );
}

/** Collapsible block with a sticky header; the tree view's open state */
function Section({
  name,
  ...props
}: Omit<React.ComponentProps<typeof SectionBlock>, 'open' | 'onToggle'> & {
  name: string;
}) {
  const { isOpen, toggle } = useStoreUI();
  const id = sectionId(name);
  return (
    <SectionBlock
      {...props}
      open={isOpen(id)}
      onToggle={() => toggle(id)}
      chevron
    />
  );
}

/** Props making a row (tr or div) expand on click or Enter/Space */
function useRowProps(id: string, className?: string) {
  const { isOpen, toggle, selected } = useStoreUI();
  const change = useContext(DiffContext)?.get(id)?.kind;
  const open = isOpen(id);
  return {
    open,
    props: {
      'data-id': id,
      'data-change': change,
      tabIndex: 0,
      'aria-expanded': open,
      className: clsx(
        styles.row,
        className,
        selected === id && styles.selected,
      ),
      onClick: () => toggle(id),
      onKeyDown: onActivateKey(() => toggle(id)),
    },
  };
}

function EndpointTreeRows({ rows }: { rows: readonly EndpointRow[] }) {
  const { shown, footer } = useLimitedRows(
    showAllId(sectionId('endpoints')),
    rows,
  );
  return (
    <>
      {shown.map(row => (
        <EndpointTreeRow key={row.id} row={row} />
      ))}
      {footer}
    </>
  );
}

/** Rows capped at ROW_LIMIT until "Show all" (`showAll` toggles it) */
function useLimitedRows<T>(showAll: string, rows: readonly T[]) {
  const { isOpen, toggle } = useStoreUI();
  const all = isOpen(showAll);
  const shown = all ? rows : rows.slice(0, ROW_LIMIT);
  const footer =
    rows.length > ROW_LIMIT ?
      <button
        type="button"
        className={styles.showAll}
        onClick={() => toggle(showAll)}
      >
        {all ? 'Show fewer' : `Show all ${rows.length}`}
      </button>
    : null;
  return { shown, footer };
}

function OptimisticSection({ model }: { model: StoreModel }) {
  if (!model.optimistic.length) return null;
  return (
    <Section
      name="optimistic"
      title="Optimistic"
      count={model.optimistic.length}
    >
      {model.optimistic.map(action => (
        <OptimisticRow key={optimisticId(action)} action={action} />
      ))}
    </Section>
  );
}

function OptimisticRow({
  action,
}: {
  action: StoreModel['optimistic'][number];
}) {
  const { open, props } = useRowProps(optimisticId(action));
  const { method, path } = splitKey(action.key);
  return (
    <>
      <div {...props}>
        <Chevron open={open} />
        <span className={clsx(styles.method, styles.optimistic)}>{method}</span>
        <span className={styles.trunc}>{path}</span>
        <span className={clsx(styles.pill, styles.optimistic)}>
          waiting for server
        </span>
      </div>
      {open && (
        <div className={styles.detail}>
          <Field name="key" node={{ t: 'val', v: action.key }} />
          <Field name="args" node={plain(action.args)} />
          <Field name="fetchedAt" node={{ t: 'val', v: action.fetchedAt }} />
        </div>
      )}
    </>
  );
}

/** Bookkeeping most people never need, collapsed by default */
function InternalsSection({ model }: { model: StoreModel }) {
  return (
    <Section name="internals" title="Internals">
      <Internals model={model} />
    </Section>
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
      {open && <EndpointDetail row={row} collapsedMeta />}
    </>
  );
}

function EndpointLabel({ row, open }: { row: EndpointRow; open: boolean }) {
  return (
    <>
      <Chevron open={open} />
      <span className={styles.trunc}>
        <EndpointKey method={row.method} path={row.path} />
      </span>
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
  const { shown, footer } = useLimitedRows(
    showAllId(groupId(table.key)),
    table.rows,
  );
  return (
    <>
      <div {...props}>
        <GroupLabel table={table} open={open} />
      </div>
      {open && (
        <div className={styles.indent}>
          {shown.map(row => (
            <EntityTreeRow key={row.id} row={row} table={table} model={model} />
          ))}
          {footer}
        </div>
      )}
    </>
  );
}

function EntityTreeRow({
  row,
  table,
  model,
}: {
  row: EntityRow;
  table: EntityTable;
  model: StoreModel;
}) {
  const { open, props } = useRowProps(row.id);
  const change = useContext(DiffContext)?.get(row.id);
  // the pk is the row's key, so its field would only repeat it
  const preview =
    row.value.t === 'obj' && table.pkField ?
      {
        ...row.value,
        entries: row.value.entries.filter(([k]) => k !== table.pkField),
      }
    : row.value;
  return (
    <>
      <div {...props}>
        <Chevron open={open} />
        <span className={styles.key}>{prettyPk(row.pk)}</span>
        <span className={styles.trunc}>
          {change?.fields && table.kind === 'entity' ?
            <FieldChanges row={row} fields={change.fields} was={change.was} />
          : change?.was ?
            <CellChange was={change.was} now={row.value} name="value">
              <Inline node={preview} bare />
            </CellChange>
          : <Inline node={preview} bare />}
        </span>
      </div>
      {open && (
        <div className={styles.indent}>
          <EntityDetail row={row} model={model} collapsedMeta />
        </div>
      )}
    </>
  );
}

/** Just the fields an update changed, as the action that did it shows them */
function FieldChanges({
  row,
  fields,
  was,
}: {
  row: EntityRow;
  fields: readonly string[];
  was: VNode | undefined;
}) {
  return (
    <span className={styles.inlineList}>
      {fields.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 && <span className={styles.dim}>, </span>}
          <FieldChange
            name={name}
            was={was && field(was, name)}
            now={field(row.value, name)}
          />
        </React.Fragment>
      ))}
    </span>
  );
}
