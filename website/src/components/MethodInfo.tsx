import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import styles from './MethodInfo.module.css';
import playgroundstyles from './Playground/styles.module.css';

/** Wraps a Resource member's description, EndpointPlayground and the
 * Field/Value table after it (docs/rest/api/resource.md). The site shows the
 * table's rows as a card above the description: a property grid where there
 * is room, Request and Response groups of rows on a phone. Values that pass a
 * resource() option through unchanged (links to its #arguments) are marked.
 * The .md pages agents read keep the table. */
export default function MethodInfo({
  children,
}: {
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const tableAt = parts.findIndex(part => tbodyOf(part));
  if (tableAt < 1) return <>{children}</>;

  const fields = fieldsOf(tbodyOf(parts[tableAt]));
  const response = fields.filter(f => RESPONSE_KEYS.includes(f.key));
  const verb = fields
    .find(f => f.key === 'method')
    ?.text.replace(/'/g, '')
    .trim();
  const row = ({ key, value }: Field) => (
    <div
      key={key}
      className={clsx(styles.row, key === 'process' && styles.block)}
    >
      <dt>{key}</dt>
      <dd>
        {key === 'method' ?
          <span className={styles.method}>{verb}</span>
        : markInherited(value)}
      </dd>
    </div>
  );
  return (
    <>
      <section
        className={clsx(styles.card, playgroundstyles.stageHues)}
        data-method={verb}
      >
        <div className={styles.group}>
          <h4 className={styles.groupHead}>
            {translate({ id: 'methodInfo.request', message: 'Request' })}
          </h4>
          <dl>{fields.filter(f => !response.includes(f)).map(row)}</dl>
        </div>
        <div className={styles.group}>
          <h4 className={styles.groupHead}>
            {translate({ id: 'methodInfo.response', message: 'Response' })}
          </h4>
          <dl>{response.map(row)}</dl>
        </div>
        {fields.some(f => hasInherited(f.value)) ?
          <p className={styles.legend}>
            <span className={styles.inherited}>
              {translate({
                id: 'methodInfo.inherited',
                message: 'from resource()',
              })}
            </span>
          </p>
        : null}
      </section>
      {parts.slice(0, tableAt)}
      {parts.slice(tableAt + 1)}
    </>
  );
}

/** a link to one of resource()'s #arguments: the option passes through */
const isInherited = (node: React.ReactNode): node is MdxElement =>
  React.isValidElement(node) &&
  `${(node.props as { href?: unknown }).href ?? ''}`.startsWith('#');

const hasInherited = (node: React.ReactNode): boolean =>
  React.Children.toArray(node).some(
    child =>
      isInherited(child) ||
      (React.isValidElement(child) &&
        hasInherited((child as MdxElement).props.children)),
  );

function markInherited(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, child => {
    if (isInherited(child))
      return <span className={styles.inherited}>{child}</span>;
    const el = child as MdxElement;
    return React.isValidElement(child) && el.props.children ?
        React.cloneElement(el, undefined, markInherited(el.props.children))
      : child;
  });
}

const RESPONSE_KEYS = ['schema', 'process'];

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
