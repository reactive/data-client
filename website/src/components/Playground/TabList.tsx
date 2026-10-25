import clsx from 'clsx';
import type { KeyboardEvent, ReactNode } from 'react';

import styles from './styles.module.css';

interface TabItem {
  key: string;
  label: ReactNode;
  selected: boolean;
  /** A click, or ← → Home End from the selected tab */
  onSelect: () => void;
}

export default function TabList({
  tabs,
  className,
  label,
}: {
  tabs: readonly TabItem[];
  className?: string;
  /** Names the list for assistive tech */
  label?: string;
}) {
  // the selected tab is the one in the tab order; the arrows move from it
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = tabs.findIndex(tab => tab.selected);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let to: number;
    switch (event.key) {
      case forward:
        to = (from + 1) % tabs.length;
        break;
      case backward:
        to = (from - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    tabs[to].onSelect();
    (event.currentTarget.children[to] as HTMLElement | undefined)?.focus();
  };
  return (
    <div
      className={clsx(styles.tabs, className)}
      role="tablist"
      aria-orientation="horizontal"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {tabs.map(({ key, label, selected, onSelect }) => (
        <div
          role="tab"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          key={key}
          onClick={onSelect}
          className={clsx(styles.tab, { [styles.selected]: selected })}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
