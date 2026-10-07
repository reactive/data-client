import React, { type ReactNode } from 'react';

import styles from './styles.module.css';

export type ErrorKind = 'compile' | 'runtime';

/** Each kind's label and icon paths (24×24, stroked) */
const KINDS: Record<ErrorKind, { label: string; icon: string[] }> = {
  // warning triangle
  compile: {
    label: 'Compile error',
    icon: ['M12 3.5 2.5 20h19L12 3.5Z', 'M12 10v4.5', 'M12 17.5h.01'],
  },
  // octagon with ×
  runtime: {
    label: 'Runtime error',
    icon: [
      'M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8L8 2.5Z',
      'm9 9 6 6M15 9l-6 6',
    ],
  },
};

/** Card framing a preview failure: what stage failed (compile or runtime) and the message */
export default function ErrorPanel({
  kind,
  children,
  action,
}: {
  kind: ErrorKind;
  children: ReactNode;
  action?: ReactNode;
}) {
  const { label, icon } = KINDS[kind];
  return (
    <div className={styles.previewError} data-kind={kind}>
      <div className={styles.errorKind}>
        <svg
          className={styles.errorIcon}
          viewBox="0 0 24 24"
          width="1em"
          height="1em"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon.map(d => (
            <path key={d} d={d} />
          ))}
        </svg>
        {label}
      </div>
      {children}
      {action}
    </div>
  );
}
