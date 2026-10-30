import clsx from 'clsx';
import React from 'react';

import styles from './MethodInfo.module.css';
import playgroundStyles from './Playground/styles.module.css';

/** A Resource member's Field/Value table (docs/rest/api/resource.md) as the
 * site shows it: its method and path as one request line, the other fields
 * below. Rows go method, path, then the rest. Pages agents read keep the plain
 * table it wraps. */
export default function MethodInfo({
  method,
  children,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(styles.methodInfo, playgroundStyles.stageHues)}
      data-method={method}
    >
      {children}
    </div>
  );
}
