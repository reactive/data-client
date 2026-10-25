import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

export default function Header({
  children,
  className,
  onClick,
  small = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  small?: boolean;
}) {
  return (
    <div
      className={clsx(
        styles.playgroundHeader,
        className,
        onClick ? styles.clickable : null,
        { [styles.small]: small },
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
