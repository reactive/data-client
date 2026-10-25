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
  title?: string;
  selected: boolean;
  /** A click, or ← → Home End from the selected tab */
  onSelect: () => void;
}

export default function TabList({
  tabs,
  className,
  tabClassName,
  label,
}: {
  tabs: readonly TabItem[];
  className?: string;
  /** Replaces the file tabs' look (their classes and edge marks are
   * dropped); style the picked one by `aria-selected` */
  tabClassName?: string;
  /** Names the list for assistive tech */
  label?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const selected = tabs.findIndex(tab => tab.selected);
  useFlushEdges(list, selected, tabClassName === undefined);
  // the selected tab is the one in the tab order; the arrows move from it
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let to: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft': {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
        to = (selected + step + tabs.length) % tabs.length;
        break;
      }
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
      className={tabClassName ? className : clsx(styles.tabs, className)}
      role="tablist"
      aria-orientation="horizontal"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {tabs.map(({ key, label, title, selected, onSelect }) => (
        <div
          role="tab"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          key={key}
          title={title}
          onClick={onSelect}
          className={
            tabClassName ?? clsx(styles.tab, { [styles.selected]: selected })
          }
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/** Scrolls the selected tab into the row's view and marks the row
 * `data-flush-left` / `data-flush-right` while that tab is too near the
 * header's edge for its curve and the corner of what it rises from
 * (`--pg-card-radius` each) to fit between, so that corner squares to meet it */
function useFlushEdges(
  list: RefObject<HTMLDivElement | null>,
  selected: number,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const row = list.current;
    const edges = row?.parentElement;
    if (!row || !edges) return;
    const reach = Math.max(
      1,
      2 *
        (parseFloat(
          getComputedStyle(row).getPropertyValue('--pg-card-radius'),
        ) || 0),
    );
    const mark = () => {
      const tab = row.children[selected]?.getBoundingClientRect();
      const box = edges.getBoundingClientRect();
      row.toggleAttribute(
        'data-flush-left',
        !!tab && tab.left < box.left + reach,
      );
      row.toggleAttribute(
        'data-flush-right',
        !!tab && tab.right > box.right - reach,
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
  }, [list, selected, enabled]);
}
