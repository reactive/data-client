import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

const TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)|\b(true|false|null)\b/g;

/** JSON in the Store's syntax colors for the theme (the sheet follows the
 * theme, so Prism's always-dark code colors don't fit) */
export default function Json({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [token, string, colon, number] = match;
    parts.push(text.slice(last, match.index));
    const kind =
      colon ? styles.key
      : string ? styles.string
      : number ? styles.number
      : styles.literal;
    parts.push(
      <span key={match.index} className={kind}>
        {string ?? token}
      </span>,
      colon,
    );
    last = match.index + token.length;
  }
  parts.push(text.slice(last));
  return <pre className={clsx(styles.json, className)}>{parts}</pre>;
}
