import clsx from 'clsx';
import React from 'react';

import styles from './MethodInfo.module.css';
import playgroundstyles from './Playground/styles.module.css';

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

  const description = parts.slice(0, tableAt - 1);
  const playground = parts[tableAt - 1];
  const fields = fieldsOf(tbodyOf(parts[tableAt]));
  const field = (key: string) => fields.find(f => f.key === key);
  const options = fields.filter(f => !CARD_KEYS.includes(f.key));
  const response = [field('schema'), field('process')].filter(
    (f): f is Field => !!f,
  );
  const verb = field('method')?.text.replace(/'/g, '');
  return (
    <>
      <section
        className={clsx(styles.card, playgroundstyles.stageHues)}
        data-method={verb}
      >
        <div className={styles.head}>
          <code className={styles.path}>{field('path')?.value}</code>
          {verb ?
            <span className={styles.method}>{verb}</span>
          : null}
        </div>
        {description}
        {options.length ?
          <ul className={styles.options}>
            {options.map(({ key, value, text }) => (
              <li key={key}>
                {text === key ? null : <i>{key} </i>}
                {value}
              </li>
            ))}
          </ul>
        : null}
        {response.length ?
          <dl className={styles.response}>
            {response.map(({ key, value }) => (
              <React.Fragment key={key}>
                <dt>{key}</dt>
                <dd className={key === 'process' ? styles.block : undefined}>
                  {value}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        : null}
      </section>
      {playground}
      {parts.slice(tableAt + 1)}
    </>
  );
}

const CARD_KEYS = ['method', 'path', 'schema', 'process'];

interface Field {
  key: string;
  value: React.ReactNode;
  text: string;
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
    return { key: textOf(key).trim(), value, text: textOf(value).trim() };
  });
}

function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join('');
  return React.isValidElement(node) ?
      textOf((node as MdxElement).props.children)
    : '';
}
