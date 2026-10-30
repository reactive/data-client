import clsx from 'clsx';
import React, { createContext, useContext, useMemo, useState } from 'react';

import { EndpointDetail, EntityDetail, Status } from './Details';
import { changeProps, onActivateKey } from './dom';
import {
  groupId,
  optimisticId,
  prettyPk,
  type EndpointRow,
  type EntityRow,
  type EntityTable,
  type StoreModel,
} from './model';
import { DiffContext, useNav } from './nav';
import { plain, type VNode } from './refs';
import {
  Chevron,
  GroupLabel,
  endpointsList,
  Internals,
  More,
  preview,
  SectionBlock,
  tableList,
  useSectionToggles,
  useShownSections,
} from './Sections';
import styles from './store.module.css';
import {
  CellChange,
  changesByField,
  EndpointKey,
  Field,
  field,
  FieldChange,
  Inline,
} from './Value';
import { splitKey } from '../../splitKey';

/** Explorer: one line per row with a preview of its fields, which expands
 * in place; references, "N more" and long lists dive in, as in the table
 * view */
export default function TreeView() {
  const { model } = useNav();
  const shown = useShownSections(model);
  const section = useSectionToggles();
  const endpoints = preview(model.endpoints);
  // kept here, so a row hidden with its group or section reopens as left
  const [choices, setChoices] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );
  const open = useMemo(() => ({ choices, setChoices }), [choices]);
  // a group's default is fixed when it first appears, so tables arriving
  // later (Suspense loads them one by one) never reshuffle what is open
  const [groupDefaults, setGroupDefaults] = useState<
    ReadonlyMap<string, boolean>
  >(() => new Map());
  const fresh = model.tables.filter(t => !groupDefaults.has(t.key));
  if (fresh.length) {
    const next = new Map(groupDefaults);
    for (const t of fresh) next.set(t.key, next.size < OPEN_GROUPS);
    setGroupDefaults(next);
  }
  return (
    <OpenContext.Provider value={open}>
      {model.optimistic.length > 0 && (
        <SectionBlock
          {...section('Optimistic', model.optimistic.length)}
          chevron
        >
          {model.optimistic.map(action => (
            <OptimisticRow key={optimisticId(action)} action={action} />
          ))}
        </SectionBlock>
      )}
      {shown.endpoints && (
        <SectionBlock {...section('Endpoints', model.endpoints.length)} chevron>
          {endpoints.map(row => (
            <EndpointTreeRow key={row.id} row={row} />
          ))}
          <More
            hidden={model.endpoints.length - endpoints.length}
            list={() => endpointsList(model)}
            className={styles.showAll}
          />
        </SectionBlock>
      )}
      {shown.entities && (
        <SectionBlock {...section('Entities', shown.entityCount)} chevron>
          {model.tables.map(table => (
            <EntityTreeGroup
              key={table.key}
              table={table}
              defaultOpen={!!groupDefaults.get(table.key)}
            />
          ))}
        </SectionBlock>
      )}
      {shown.internals && (
        <SectionBlock {...section('Internals')} chevron>
          <Internals model={model} />
        </SectionBlock>
      )}
    </OpenContext.Provider>
  );
}

/** The first Entity types to appear start open */
const OPEN_GROUPS = 3;

/** The reader's open and closed choices, by row or group id */
const OpenContext = createContext<{
  readonly choices: ReadonlyMap<string, boolean>;
  readonly setChoices: React.Dispatch<
    React.SetStateAction<ReadonlyMap<string, boolean>>
  >;
}>({ choices: new Map(), setChoices: () => {} });

/** Props making a row (tr or div) expand on click or Enter/Space */
function useRowProps(id: string, defaultOpen = false) {
  const { choices, setChoices } = useContext(OpenContext);
  const open = choices.get(id) ?? defaultOpen;
  const change = useContext(DiffContext)?.get(id)?.kind;
  const toggle = () => setChoices(prev => new Map(prev).set(id, !open));
  return {
    open,
    props: {
      'data-id': id,
      ...changeProps(change),
      tabIndex: 0,
      'aria-expanded': open,
      className: styles.row,
      onClick: toggle,
      onKeyDown: onActivateKey(toggle),
    },
  };
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
  defaultOpen,
}: {
  table: EntityTable;
  defaultOpen: boolean;
}) {
  const { open, props } = useRowProps(groupId(table.key), defaultOpen);
  const rows = preview(table.rows);
  return (
    <>
      <div {...props}>
        <GroupLabel table={table} open={open} />
      </div>
      {open && (
        <div className={styles.indent}>
          {rows.map(row => (
            <EntityTreeRow key={row.id} row={row} table={table} />
          ))}
          <More
            hidden={table.rows.length - rows.length}
            list={() => tableList(table)}
            className={styles.showAll}
          />
        </div>
      )}
    </>
  );
}

function EntityTreeRow({ row, table }: { row: EntityRow; table: EntityTable }) {
  const { model } = useNav();
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
          {(
            change?.fields &&
            table.kind === 'entity' &&
            changesByField(row.value, change.was)
          ) ?
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
