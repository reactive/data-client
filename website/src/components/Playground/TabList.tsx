import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './styles.module.css';

interface TabItem {
  key: string;
  label: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export default function TabList({ tabs }: { tabs: readonly TabItem[] }) {
  return (
    <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
      {tabs.map(({ key, label, selected, onSelect }) => (
        <div
          role="tab"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          key={key}
          onClick={onSelect}
          onFocus={onSelect}
          className={clsx(styles.tab, { [styles.selected]: selected })}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
