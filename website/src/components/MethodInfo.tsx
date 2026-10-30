import React from 'react';

import { DefinitionContext, type Field } from './HTTP/Definition';

/** Wraps a Resource member's EndpointPlayground and the Field/Value table
 * after it (docs/rest/api/resource.md). The site shows each field in the
 * playground's exchange, where it acts (./HTTP/Definition); pages agents read
 * keep the plain table. */
export default function MethodInfo({
  children,
}: {
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const table = parts.find(part => tbodyOf(part));
  const fields = table ? fieldsOf(tbodyOf(table)) : null;
  return (
    <DefinitionContext.Provider value={fields}>
      {parts.filter(part => part !== table)}
    </DefinitionContext.Provider>
  );
}

type Element = React.ReactElement<{ children?: React.ReactNode }>;

const elements = (node: React.ReactNode) =>
  React.Children.toArray(node).filter((child): child is Element =>
    React.isValidElement(child),
  );

/** MDX renders a markdown table as table > (thead, tbody) */
const tbodyOf = (node: React.ReactNode) =>
  React.isValidElement(node) ?
    elements((node as Element).props.children).find(
      child => child.type === 'tbody',
    )
  : undefined;

function fieldsOf(tbody: Element | undefined): Field[] {
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
      textOf((node as Element).props.children)
    : '';
}
