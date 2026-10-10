import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

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
import { plain } from './refs';
import {
  Chevron,
  GroupLabel,
  Internals,
  SectionBlock,
  sectionTitle,
  type SectionName,
} from './Sections';
import styles from './store.module.css';
import {
  groupId,
  ROW_LIMIT,
  sectionId,
  showAllId,
  useStoreUI,
} from './StoreUI';
import { EndpointKey, Field, Inline } from './Value';

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
  const entityCount = model.tables.reduce((n, t) => n + t.rows.length, 0);
  return (
    <>
      <OptimisticSection model={model} />
      <Section name="endpoints" count={model.endpoints.length}>
        {endpoints}
      </Section>
      <Section name="entities" count={entityCount}>
        {model.tables.map(renderTable)}
      </Section>
      <InternalsSection model={model} />
    </>
  );
}

/** Collapsible block with a sticky header; the tree view's open state */
function Section({
  name,
  ...props
}: Omit<
  React.ComponentProps<typeof SectionBlock>,
  'open' | 'onToggle' | 'title'
> & {
  name: SectionName;
}) {
  const { isOpen, toggle } = useStoreUI();
  const id = sectionId(name);
  return (
    <SectionBlock
      {...props}
      title={sectionTitle(name)}
      open={isOpen(id)}
      onToggle={() => toggle(id)}
      chevron
    />
  );
}

/** Props making a row (tr or div) expand on click or Enter/Space */
function useRowProps(id: string, className?: string) {
  const { isOpen, toggle, selected } = useStoreUI();
  const open = isOpen(id);
  return {
    open,
    props: {
      'data-id': id,
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
        {all ?
          translate({
            id: 'playground.store.tree.showFewer',
            message: 'Show fewer',
          })
        : translate(
            {
              id: 'playground.store.tree.showAll',
              message: 'Show all {count}',
            },
            { count: rows.length },
          )
        }
      </button>
    : null;
  return { shown, footer };
}

function OptimisticSection({ model }: { model: StoreModel }) {
  if (!model.optimistic.length) return null;
  return (
    <Section name="optimistic" count={model.optimistic.length}>
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
          <Translate id="playground.store.optimistic.waiting">
            waiting for server
          </Translate>
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
    <Section name="internals">
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
          <Inline node={preview} bare />
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
