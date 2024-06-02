import clsx from 'clsx';

import styles from './Grid.module.css';

export default function Grid({ children, cols = 2, wrap = false }) {
  return (
    <div className={clsx(styles.grid, { [styles.wrap]: wrap })}>
      {typeof children === 'string' ?
        children
      : Array.isArray(children) ?
        children
      : children.props.children}
    </div>
  );
}
