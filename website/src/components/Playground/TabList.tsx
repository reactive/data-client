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
  /** A click, Enter or Space, or ← → Home End from the selected tab */
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
  const fileTabs = tabClassName === undefined;
  useFlushEdges(list, selected, tabs.map(tab => tab.key).join(), fileTabs);
  // the selected tab is the one in the tab order; the arrows move from it
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // modified keys keep their own meaning (Alt+← is Back)
    if (event.altKey || event.ctrlKey || event.metaKey) return;
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
      // the focused tab, as a click picks it (a picked tab may act again)
      case 'Enter':
      case ' ':
        to = Array.prototype.indexOf.call(
          event.currentTarget.children,
          event.target,
        );
        // a control inside a tab keeps its keys
        if (to < 0) return;
        // a held key picks once (and doesn't scroll the page)
        if (event.repeat) {
          event.preventDefault();
          return;
        }
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
      className={fileTabs ? clsx(styles.tabs, className) : className}
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
            fileTabs ?
              clsx(styles.tab, { [styles.selected]: selected })
            : tabClassName
          }
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/** Scrolls the selected tab into the row's view with its scroll padding, and
 * marks the row `data-more-left` / `data-more-right`
 * while tabs hide past that edge (where it fades) and `data-flush-left` /
 * `data-flush-right` while the selected tab is too near the header's edge
 * for its curve and the corner of what it rises from (`--pg-card-radius`
 * each) to fit between, so that corner squares to meet it */
function useFlushEdges(
  list: RefObject<HTMLDivElement | null>,
  selected: number,
  /** the tabs' keys: new tabs are new elements to observe */
  keys: string,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const row = list.current;
    const edges = row?.parentElement;
    if (!row || !edges) return;
    const style = getComputedStyle(row);
    const reach = Math.max(
      1,
      2 * (parseFloat(style.getPropertyValue('--pg-card-radius')) || 0),
    );
    const mark = () => {
      const tab = row.children[selected]?.getBoundingClientRect();
      const box = edges.getBoundingClientRect();
      const view = row.getBoundingClientRect();
      row.toggleAttribute(
        'data-flush-left',
        !!tab && tab.left < box.left + reach,
      );
      row.toggleAttribute(
        'data-flush-right',
        !!tab && tab.right > box.right - reach,
      );
      const first = row.firstElementChild?.getBoundingClientRect();
      const last = row.lastElementChild?.getBoundingClientRect();
      // a pixel's slack: zoomed, scroll positions land between pixels
      row.toggleAttribute(
        'data-more-left',
        !!first && first.left < view.left - 1,
      );
      row.toggleAttribute(
        'data-more-right',
        !!last && last.right > view.right + 1,
      );
    };
    const reveal = () => {
      const tab = row.children[selected]?.getBoundingClientRect();
      const view = row.getBoundingClientRect();
      if (!tab) return;
      // the row's scroll padding, so the next tab peeks past the fade (the
      // scroll clamps it away at the ends)
      const right = tab.right + parseFloat(style.scrollPaddingRight);
      const left = tab.left - parseFloat(style.scrollPaddingLeft);
      if (right > view.right) row.scrollLeft += right - view.right;
      else if (left < view.left) row.scrollLeft -= view.left - left;
    };
    reveal();
    mark();
    row.addEventListener('scroll', mark, { passive: true });
    // the header resizing, or the tabs (their names widen when the web font
    // lands), moves the selected one: reveal it again
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(() => {
          reveal();
          mark();
        })
      );
    observer?.observe(edges);
    for (const tab of row.children) observer?.observe(tab);
    return () => {
      row.removeEventListener('scroll', mark);
      observer?.disconnect();
    };
  }, [list, selected, keys, enabled]);
}
