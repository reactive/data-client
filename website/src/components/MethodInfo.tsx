import React from 'react';

import styles from './MethodInfo.module.css';

const METHOD = /^'(GET|POST|PUT|PATCH|DELETE)'$/;

/** The `method` value ('GET') somewhere in the wrapped table */
function findMethod(node: React.ReactNode): string | undefined {
  if (typeof node === 'string') return METHOD.exec(node.trim())?.[1];
  if (Array.isArray(node)) {
    for (const child of node) {
      const method = findMethod(child);
      if (method) return method;
    }
  } else if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return findMethod(node.props.children);
  }
}

/** A Resource member's Field/Value table (docs/rest/api/resource.md) as the
 * site shows it: its method and path as one request line, the other fields
 * below. Rows go method, path, then the rest. Pages agents read keep the plain
 * table it wraps. */
export default function MethodInfo({
  children,
}: {
  children: React.ReactNode;
}) {
  const method = findMethod(children);
  return (
    <div
      className={styles.methodInfo}
      data-method={method}
      style={
        method ?
          ({ '--method': `'${method}'` } as React.CSSProperties)
        : undefined
      }
    >
      {children}
    </div>
  );
}
