import clsx from 'clsx';
import React from 'react';

import styles from './SchemaTable.module.css';

/** The schema overview table (docs/core/shared/_schema_table.mdx) as the site
 * shows it: each data type a tinted group, ✅/🛑 cells (`data-mark`) drawn as a
 * check or a dash. Pages agents read keep the plain table it wraps. */
export default function SchemaTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={clsx('table-scroll', styles.schemaTable)}>{children}</div>
  );
}
