import React from 'react';

import styles from './MethodInfo.module.css';

/** Wraps a Resource member's description, EndpointPlayground and the
 * Field/Value table after it (docs/rest/api/resource.md). The site shows the
 * table's rows as a card around the description: the path as its title, the
 * method as a pill, the other options as chips and what reads the response at
 * its foot. The .md pages agents read keep the table. */
export default function MethodInfo({
  children,
}: {
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const tableAt = parts.findIndex(part => tbodyOf(part));
  if (tableAt < 1) return <>{children}</>;

  const fields = fieldsOf(tbodyOf(parts[tableAt]));
  const [method, path, schema, process] = CARD_KEYS.map(key =>
    fields.find(f => f.key === key),
  );
  const options = fields.filter(f => !CARD_KEYS.includes(f.key));
  const verb = method && textOf(method.value).replace(/'/g, '').trim();
  return (
    <>
      <section className={styles.card} data-method={verb}>
        <div className={styles.head}>
          <code className={styles.path}>{path?.value}</code>
          {verb ?
            <span className={styles.method}>{verb}</span>
          : null}
        </div>
        {parts.slice(0, tableAt - 1)}
        {options.length ?
          <ul className={styles.options}>
            {options.map(({ key, value, same }) => (
              <li key={key}>
                {same ? null : <i>{key} </i>}
                {value}
              </li>
            ))}
          </ul>
        : null}
        <dl className={styles.response}>
          {[schema, process].map(f =>
            f ?
              <React.Fragment key={f.key}>
                <dt>{f.key}</dt>
                <dd>{f.value}</dd>
              </React.Fragment>
            : null,
          )}
        </dl>
      </section>
      {parts[tableAt - 1]}
      {parts.slice(tableAt + 1)}
    </>
  );
}

const CARD_KEYS = ['method', 'path', 'schema', 'process'];

interface Field {
  key: string;
  value: React.ReactNode;
  /** the value reads as its key, e.g. [body](#body) */
  same: boolean;
}

type MdxElement = React.ReactElement<{ children?: React.ReactNode }>;

const elements = (node: React.ReactNode) =>
  React.Children.toArray(node).filter((child): child is MdxElement =>
    React.isValidElement(child),
  );

/** MDX renders a markdown table as table > (thead, tbody) */
const tbodyOf = (node: React.ReactNode) =>
  React.isValidElement(node) ?
    elements((node as MdxElement).props.children).find(
      child => child.type === 'tbody',
    )
  : undefined;

function fieldsOf(tbody: MdxElement | undefined): Field[] {
  return elements(tbody?.props.children).map(row => {
    const [key, value] = elements(row.props.children).map(
      cell => cell.props.children,
    );
    const name = textOf(key).trim();
    return { key: name, value, same: textOf(value).trim() === name };
  });
}

function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join('');
  return React.isValidElement(node) ?
      textOf((node as MdxElement).props.children)
    : '';
}
