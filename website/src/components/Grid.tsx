import clsx from 'clsx';
import type { ReactElement, ReactNode } from 'react';

import styles from './Grid.module.css';

export default function Grid({
  children,
  wrap = false,
}: {
  children: ReactNode;
  cols?: number;
  wrap?: boolean;
}) {
  return (
    <div className={clsx(styles.grid, { [styles.wrap]: wrap })}>
      {typeof children === 'string' ?
        children
      : Array.isArray(children) ?
        children
      : (children as ReactElement<{ children?: ReactNode }>).props.children}
    </div>
  );
}
