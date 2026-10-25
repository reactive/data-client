import clsx from 'clsx';
import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

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
  const list = useRef<HTMLDivElement>(null);
  const selected = tabs.findIndex(tab => tab.selected);
  useFlushEdges(list, selected);
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
      ref={list}
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

/** Scrolls the selected tab into the row's view and marks the row
 * `data-flush-left` / `data-flush-right` while that tab meets the header's
 * edge, where what it rises from squares its corner to meet it */
function useFlushEdges(
  list: RefObject<HTMLDivElement | null>,
  selected: number,
) {
  useLayoutEffect(() => {
    const row = list.current;
    const edges = row?.parentElement;
    if (!row || !edges) return;
    const mark = () => {
      const tab = row.children[selected]?.getBoundingClientRect();
      const box = edges.getBoundingClientRect();
      row.toggleAttribute('data-flush-left', !!tab && tab.left <= box.left + 1);
      row.toggleAttribute(
        'data-flush-right',
        !!tab && tab.right >= box.right - 1,
      );
    };
    const tab = row.children[selected]?.getBoundingClientRect();
    const view = row.getBoundingClientRect();
    if (tab && tab.right > view.right) row.scrollLeft += tab.right - view.right;
    else if (tab && tab.left < view.left)
      row.scrollLeft -= view.left - tab.left;
    mark();
    row.addEventListener('scroll', mark, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(mark)
      );
    observer?.observe(edges);
    return () => {
      row.removeEventListener('scroll', mark);
      observer?.disconnect();
    };
  }, [list, selected]);
}
