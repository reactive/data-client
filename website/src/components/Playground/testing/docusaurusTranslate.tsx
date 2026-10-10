// Jest stand-in for @docusaurus/Translate (a webpack alias outside Docusaurus):
// the English message with its {placeholders} filled in, as an untranslated site shows
import React, { type ReactNode } from 'react';

type Values = Record<string, ReactNode>;

function interpolate(message: string, values: Values = {}): ReactNode {
  const parts = message
    .split(/(\{\w+\})/)
    .map(part =>
      /^\{\w+\}$/.test(part) && part.slice(1, -1) in values ?
        values[part.slice(1, -1)]
      : part,
    );
  return parts.every(part => typeof part !== 'object') ?
      parts.join('')
    : React.createElement(React.Fragment, null, ...parts);
}

export function translate(
  { message, id }: { message?: string; id?: string },
  values?: Values,
): string {
  return interpolate(message ?? id ?? '', values) as string;
}

export default function Translate({
  children,
  id,
  values,
}: {
  children?: string;
  id?: string;
  values?: Values;
}) {
  return <>{interpolate(children ?? id ?? '', values)}</>;
}
