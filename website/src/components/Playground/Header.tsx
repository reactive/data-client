import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

export default function Header({
  children,
  className,
  small = false,
}: {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}) {
  return (
    <div
      className={clsx(styles.playgroundHeader, className, {
        [styles.small]: small,
      })}
    >
      {children}
    </div>
  );
}
