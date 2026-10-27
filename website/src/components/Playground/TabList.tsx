import clsx from 'clsx';
import {
  useEffect,
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
  pill = false,
}: {
  tabs: readonly TabItem[];
  className?: string;
  /** Replaces the file tabs' look (their classes and edge marks are
   * dropped); style the picked one by `aria-selected` */
  tabClassName?: string;
  /** Names the list for assistive tech */
  label?: string;
  /** Lays a pill under the selected tab for `className` to draw and slide:
   * the list gets `data-pill` once placed, with `--pill-left` and
   * `--pill-width`, and `data-pill-settled` once the pill may slide */
  pill?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  const selected = tabs.findIndex(tab => tab.selected);
  const fileTabs = tabClassName === undefined;
  const keys = tabs.map(tab => tab.key).join();
  useOverflowEdges(list, selected, keys, fileTabs);
  useSelectedPill(list, selected, keys, pill);
  usePillSettled(list, pill);
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

/** Measures the selected tab into the list's `--pill-left` and
 * `--pill-width` (tabs' natural widths differ, so a pill can't step by equal
 * segments), again when a tab resizes (the web font landing). A hidden list
 * (no width) keeps the pill where it was */
function useSelectedPill(
  list: RefObject<HTMLDivElement | null>,
  selected: number,
  /** the tabs' keys, joined: new tabs are new elements to observe */
  keys: string,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const row = list.current;
    if (!enabled || !row) return;
    const place = () => {
      const tab = row.children[selected];
      if (!(tab instanceof HTMLElement) || !tab.offsetWidth) return;
      row.style.setProperty('--pill-left', `${tab.offsetLeft}px`);
      row.style.setProperty('--pill-width', `${tab.offsetWidth}px`);
      row.setAttribute('data-pill', '');
    };
    place();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(place);
    for (const tab of row.children) observer.observe(tab);
    return () => observer.disconnect();
  }, [list, selected, keys, enabled]);
}

/** Sets `data-pill-settled` two frames after mount, so a pick restored as
 * the page loads (a stored `groupId`) places the pill without sliding it */
function usePillSettled(
  list: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    // holds the pending frame's id, the second once the first has run
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        list.current?.setAttribute('data-pill-settled', ''),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [list, enabled]);
}

/** Keeps the selected tab in the row's view (its scroll padding past it) and
 * marks the row's edges: `data-more-left` / `data-more-right` while tabs hide
 * past that edge (where it fades), `data-flush-left` / `data-flush-right`
 * while the selected tab is too near the header's edge for its curve and the
 * corner of what it rises from (`--pg-card-radius` each) to fit between, so
 * that corner squares to meet it */
function useOverflowEdges(
  list: RefObject<HTMLDivElement | null>,
  selected: number,
  /** the tabs' keys, joined (a dependency that changes only with them): new
   * tabs are new elements to observe */
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
    const selectedTab = row.children[selected];
    // the row's scroll padding, so the next tab peeks past the fade (the
    // scroll clamps it away at the ends)
    const padLeft = parseFloat(style.scrollPaddingLeft) || 0;
    const padRight = parseFloat(style.scrollPaddingRight) || 0;
    const mark = () => {
      const tab = selectedTab?.getBoundingClientRect();
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
      const tab = selectedTab?.getBoundingClientRect();
      const view = row.getBoundingClientRect();
      if (!tab) return;
      const right = tab.right + padRight;
      const left = tab.left - padLeft;
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
