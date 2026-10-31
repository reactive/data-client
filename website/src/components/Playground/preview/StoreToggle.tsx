// Kept apart from StoreInspector: ../index.tsx is statically in every page
// chunk that embeds a Playground, while the Store UI loads with LivePreview

import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import type { ShowStore, StoreView } from './store/storeView';
import { useTabStorage } from '../../../utils/tabStorage';
import { useLayoutMotion } from '../../motion';
import StoreIcon from '../StoreIcon';
import styles from '../styles.module.css';

// one for the page: closing a Store closes every playground's in its group
let clicked: HTMLElement | undefined;
/** The Store toggle the reader clicked last, while on the page: held in place
 * on screen as the Stores it closed slide out and leave the layout */
export const heldToggle = () => (clicked?.isConnected ? clicked : undefined);

/** A demo's Store view, shown over the reader's saved one without saving it
 * (see `useStoreOpen`); `drop()` gives theirs back. Here, not with
 * `useStoreView` in ./store/storeView.ts: ../index.tsx provides it, and is in
 * every page chunk (see the top), so it must load the Store UI's lazy chunk
 * only with `import()` */
export interface DemoView {
  view?: StoreView;
  drop(): void;
}
export const DemoViewContext = createContext<DemoView>({ drop() {} });

/** How the Actions tab lists actions: under the interaction that started
 * them (a click, a render), or every action as its own row */
export type ActionsBy = 'interaction' | 'action';
/** The playground's group, whose readers' choice of `ActionsBy` is kept,
 * and the playground's own default (see `useActionsBy`) */
export const ActionsByContext = createContext<{
  groupId: string;
  defaultBy: ActionsBy;
}>({ groupId: 'playground', defaultBy: 'interaction' });

/** What the Store drawer shows: the store, or the actions that changed it.
 * Each has its own tab on the drawer's edge */
export type Inspect = 'store' | 'actions';
/** Shut, or open showing one */
export type InspectorOpen = Inspect | 'n';
/** Opens the drawer on tab `to` (the one showing, unless named), or shuts
 * it when that one shows */
export type ToggleStore = (
  event: React.MouseEvent<HTMLElement>,
  to?: Inspect,
) => void;
// a reader's choice saved as `'y'` is from before the actions had a tab of
// their own: the store
const inspectOf = (choice: string | null | undefined) =>
  choice === 'y' || choice === 'store' ? 'store'
  : choice === 'actions' ? 'actions'
  : choice === 'n' ? null
  : undefined;

/** Which of the drawer's tabs shows, and the quick look its other tab's
 * hover opens (`peek`); `select` shows a tab, opening the drawer if shut.
 * `listed` counts the Actions tab's handle pulled, each of which opens the
 * actions at their list */
export interface Inspector {
  readonly tab: Inspect;
  select(tab: Inspect): void;
  readonly peek: Peek;
  readonly listed: number;
}
/** Where the preview's header shows its toggles' quick look (stacked,
 * ./PreviewWrapper.tsx): over the code, above the header. Without one, the
 * header's toggles open none */
export const LookSlot = createContext<HTMLElement | null>(null);

export const InspectorContext = createContext<Inspector>({
  tab: 'store',
  select() {},
  peek: createPeek(),
  listed: 0,
});

/** Store open state, persisted per `groupId` with the tab it shows;
 * toggling keeps the page from scrolling, also as each Store it closes
 * leaves the layout (`heldToggle`). `showStore` opens or closes it for a
 * demo without persisting, until the reader toggles it; opening it in a
 * view shows that view (`demoView`) while the Store stays open, until the
 * reader picks one. */
export function useStoreOpen(groupId: string, defaultOpen: InspectorOpen) {
  const [choice, setChoice] = useTabStorage(groupId);
  const [shown, show] = useState<{
    open: boolean;
    tab?: Inspect;
    view?: StoreView;
  } | null>(null);
  const stored = inspectOf(choice);
  const opened = stored === undefined ? inspectOf(defaultOpen) : stored;
  const open = shown?.open ?? !!opened;
  // shut, the tab it last showed: the one in the tab order, which Escape
  // focuses
  const [lastTab, setLastTab] = useState<Inspect>(() => opened ?? 'store');
  const tab = shown?.tab ?? opened ?? lastTab;
  // moves made here, by the reader or a demo: only these animate the Store
  // (`useStoreMotion`); the stored choice arriving, or another Store in the
  // group closing this one, just lands
  const [moves, setMoves] = useState(0);
  const [listed, setListed] = useState(0);
  // (every open, shut or switch of tab below closes the quick look; going,
  // so does the playground, its timer with it)
  const [peek] = useState(createPeek);
  useEffect(() => peek.close, [peek]);
  // a demo's run holds one showStore from its start (./autorun/stage.ts), so
  // it reads the state as it is now; the toggles read the tab so, keeping
  // their identity as it switches
  const latestOpen = useRef(open);
  const latestTab = useRef(tab);
  useLayoutEffect(() => {
    latestOpen.current = open;
    latestTab.current = tab;
  });
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  // pressed on the tab it shows, the drawer shuts; on the other, open or
  // shut, it shows that one
  const toggle = useCallback(
    (event: { currentTarget: HTMLElement }, to = latestTab.current) => {
      clicked = event.currentTarget;
      blockElementScrollPositionUntilNextRender(clicked);
      const shut = open && to === latestTab.current;
      setChoice(shut ? 'n' : to);
      setLastTab(to);
      show(null);
      peek.close();
      if (!open || shut) setMoves(n => n + 1);
      if (!shut && to === 'actions') setListed(n => n + 1);
    },
    [blockElementScrollPositionUntilNextRender, open, setChoice, peek],
  );
  // from inside the drawer (a link to an action or a record): shows that
  // tab, sliding the drawer open if it was shut (a quick look's link)
  const select = useCallback(
    (to: Inspect) => {
      clicked = undefined;
      setChoice(to);
      setLastTab(to);
      peek.close();
      if (!latestOpen.current) {
        show(null);
        setMoves(n => n + 1);
      } else show(prev => (prev?.tab ? { ...prev, tab: undefined } : prev));
    },
    [setChoice, peek],
  );
  // a demo's open or close is no reader's click: forget the last one, so it
  // doesn't pin a toggle the reader clicked earlier
  const showStore = useCallback<ShowStore>(
    (demoOpen, view, demoTab) => {
      clicked = undefined;
      peek.close();
      if (demoOpen !== latestOpen.current) setMoves(n => n + 1);
      // opening the actions, as their handle does, it shows their list
      if (demoOpen && demoTab === 'actions') setListed(n => n + 1);
      show(prev => {
        const next = demoOpen ? (view ?? prev?.view) : undefined;
        const nextTab = demoOpen ? (demoTab ?? prev?.tab) : undefined;
        // unchanged: the playground's children don't re-render
        return (
            prev?.open === demoOpen &&
              prev.view === next &&
              prev.tab === nextTab
          ) ?
            prev
          : { open: demoOpen, tab: nextTab, view: next };
      });
    },
    [peek],
  );
  // the reader picked a view: the demo's goes, its open and tab stay
  const drop = useCallback(
    () => show(prev => (prev?.view ? { ...prev, view: undefined } : prev)),
    [],
  );
  const view = shown?.view;
  const demoView = useMemo<DemoView>(() => ({ view, drop }), [view, drop]);
  const inspector = useMemo<Inspector>(
    () => ({ tab, select, peek, listed }),
    [tab, select, peek, listed],
  );
  return [open, toggle, showStore, demoView, moves, inspector] as const;
}

/** The tab whose quick look shows */
export function useLook(): Inspect | null {
  const { peek } = useContext(InspectorContext);
  return useSyncExternalStore(peek.subscribe, peek.get, noLook);
}
const noLook = () => null;

/** Whether a quick look shows, whichever tab's */
export function useLooking(): boolean {
  const { peek } = useContext(InspectorContext);
  return useSyncExternalStore(
    peek.subscribe,
    () => peek.get() !== null,
    () => false,
  );
}

/** How long the pointer rests on a tab before its quick look opens, and is
 * away from both before it closes (ms) */
const PEEK_OPEN_MS = 150;
const PEEK_CLOSE_MS = 300;

/** The quick look a drawer tab's hover opens: outside React state, so a
 * hover re-renders only what shows it (../StoreInspector.tsx), not the
 * playground. Mouse only: a tap on the tab opens the drawer itself */
export interface Peek {
  get(): Inspect | null;
  subscribe(onChange: () => void): () => void;
  /** The pointer came onto (`true`) or left a tab's handle or its quick look */
  hover(tab: Inspect, inside: boolean, e: React.PointerEvent): void;
  close(): void;
}
export function createPeek(): Peek {
  let shown: Inspect | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const set = (next: Inspect | null) => {
    clearTimeout(timer);
    if (next === shown) return;
    shown = next;
    listeners.forEach(listener => listener());
  };
  return {
    get: () => shown,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    hover(tab, inside, e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(timer);
      // straight from one tab's quick look to the other's
      if (inside && shown !== null && shown !== tab) return set(tab);
      timer = setTimeout(
        () => set(inside ? tab : null),
        inside ? PEEK_OPEN_MS : PEEK_CLOSE_MS,
      );
    },
    close: () => set(null),
  };
}

/** Whether the Store is moving for one of `moves` (`useStoreOpen`), as
 * `data-store-moving` on the playground (`container`), which gives its
 * motion its durations (styles.module.css): until it is at rest, open or
 * shut, with nothing left sliding or fading. Any other change, from the
 * layout or the page (a tab showing the playground, a resize, hydration),
 * lands at once */
export function useStoreMotion(
  container: HTMLElement | null,
  moves: number,
  open: boolean,
) {
  const [rested, setRested] = useState(moves);
  const moving = moves !== rested;
  useEffect(() => {
    if (!container || !moving) return;
    let frame = 0;
    let cancelled = false;
    const nextFrame = () =>
      new Promise(resolve => (frame = requestAnimationFrame(resolve)));
    const settle = async () => {
      // what this move started is running by the next frame
      await nextFrame();
      while (!cancelled) {
        // shown once open, hidden once shut (none before the preview loads)
        const panel = container.querySelector(`.${styles.storePanel}`);
        // the Store's own motion, not the app's or what the Store shows (a
        // row's flash as data arrives), which would hold the playground moving
        const app = container.querySelector(`.${styles.playgroundPreview}`);
        const related = (target: Element) =>
          !app?.contains(target) &&
          (target === panel || !panel?.contains(target));
        // (no Web Animations, e.g. jsdom: nothing runs)
        const running = (container.getAnimations?.({ subtree: true }) ?? [])
          .filter(
            a =>
              a.playState === 'running' &&
              a.effect?.getTiming().iterations !== Infinity &&
              related((a.effect as KeyframeEffect).target!),
          )
          .map(a => a.finished);
        const resting = !panel || open === panel.hasAttribute('data-visible');
        if (resting && !running.length) {
          setRested(moves);
          return;
        }
        // then check again: a retargeted motion, or the panel shown or hidden
        await Promise.allSettled(running);
        await nextFrame();
      }
    };
    settle();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [container, moving, moves, open]);
  return moving;
}

/** The strip beside the result: the drawer's tabs, Actions over Store, as
 * the stacked layout shows them; also rendered (inert) by the preview
 * loading fallback in ../index.tsx */
export function StoreToggle({
  onToggle,
  open = true,
}: {
  onToggle?: ToggleStore;
  open?: boolean;
}) {
  const ref = useLayoutMotion();
  const { tab } = useContext(InspectorContext);
  return (
    <div
      ref={ref}
      className={styles.debugToggles}
      role="tablist"
      aria-orientation="vertical"
      onKeyDown={onTabKeys}
    >
      {INSPECTS.map(to => {
        const selected = open && tab === to;
        return (
          <button
            key={to}
            type="button"
            role="tab"
            className={clsx('clean-btn', styles.debugToggle)}
            title={tabTitle(to, selected)}
            aria-selected={selected}
            tabIndex={tab === to ? 0 : -1}
            disabled={!onToggle}
            onClick={onToggle && (e => onToggle(e, to))}
            data-store-toggle={to}
          >
            {tabLabel(to)}
          </button>
        );
      })}
      <span
        className={clsx(
          styles.arrow,
          open ? styles.right : styles.left,
          styles.vertical,
        )}
        aria-hidden="true"
      >
        ▶
      </span>
    </div>
  );
}

/** The drawer's tabs in the preview's header, Actions then Store, which
 * narrow playgrounds show instead of the side strip (see
 * styles.module.css): each opens the Store on its tab, or shuts it while
 * that tab shows; also rendered, disabled, by the preview loading fallback
 * in ../index.tsx to hold the layout */
export function StoreHeaderToggle({
  onClick,
  open = false,
}: {
  onClick?: ToggleStore;
  open?: boolean;
}) {
  const { tab, peek } = useContext(InspectorContext);
  // the mouse resting on one opens its quick look, as on the folder's handles
  const peeks = useContext(LookSlot) !== null && onClick;
  return INSPECTS.map(to => {
    const shown = open && tab === to;
    return (
      <HeaderToggle
        key={to}
        className={styles.storeHeaderToggle}
        title={tabTitle(to, shown)}
        label={tabLabel(to)}
        open={shown}
        data-store-toggle={to}
        onClick={onClick && (e => onClick(e, to))}
        {...(peeks && peekOn(peek, to, shown))}
      >
        {tabIcon(to)}
      </HeaderToggle>
    );
  });
}

/** The Code toggle in the preview's header (the demo layout, ../index.tsx):
 * pressed, the code takes the result's place */
export function CodeHeaderToggle({
  onClick,
  open,
}: {
  onClick: () => void;
  open: boolean;
}) {
  return (
    <HeaderToggle
      className={styles.codeHeaderToggle}
      title={
        open ?
          translate({ id: 'playground.code.hide', message: 'Hide code' })
        : translate({ id: 'playground.code.show', message: 'Show code' })
      }
      label={translate({ id: 'playground.code', message: 'Code' })}
      open={open}
      onClick={onClick}
    >
      <CodeIcon />
    </HeaderToggle>
  );
}

/** An icon button in the preview's header that reads pressed while what it
 * shows does; disabled without a handler (the loading fallback holds the
 * layout with one) */
function HeaderToggle({
  className,
  title,
  label,
  open,
  onClick,
  children,
  ...rest
}: {
  className: string;
  /** What pressing it does now */
  title: string;
  /** Its name, the same either way */
  label: string;
  open: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onPointerEnter?: React.PointerEventHandler<HTMLElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLElement>;
  children: React.ReactNode;
  'data-store-toggle'?: Inspect;
}) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.headerButton, className)}
      title={title}
      aria-label={label}
      aria-pressed={open}
      disabled={!onClick}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The folder's handles (../index.tsx renders them on the folder's drawer):
 * pull tabs in the folder's color sticking out of the preview's left edge
 * by its foot, Actions over Store (stacked, out of its top edge). Pulled,
 * one draws the folder's layer out over the code showing its view, and
 * both stay outside the drawer's edge, drawn out, the one showing joined
 * to it (see .storeDrawer in ../styles.module.css). Resting on one opens
 * its quick look (`Peek`) */
export function DrawerTabs({
  open,
  inspector: { tab, peek },
  onToggle,
  controls,
  ref,
}: {
  open: boolean;
  inspector: Inspector;
  onToggle: ToggleStore;
  /** The folder's id */
  controls: string;
  /** The tab showing, which Escape on the drawer shuts */
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <div
      className={styles.drawerTabs}
      role="tablist"
      aria-orientation="vertical"
      onKeyDown={onTabKeys}
    >
      {INSPECTS.map(to => {
        const selected = open && tab === to;
        return (
          <button
            key={to}
            ref={tab === to ? ref : undefined}
            type="button"
            role="tab"
            className={clsx('clean-btn', styles.storeTab)}
            title={tabTitle(to, selected)}
            aria-label={tabLabel(to)}
            aria-selected={selected}
            tabIndex={tab === to ? 0 : -1}
            aria-controls={controls}
            onClick={e => onToggle(e, to)}
            {...peekOn(peek, to, selected)}
            data-store-toggle={to}
          >
            {tabIcon(to)}
          </button>
        );
      })}
    </div>
  );
}
const INSPECTS = ['actions', 'store'] as const satisfies readonly Inspect[];

/** A tab's handlers for its quick look: none while it shows */
const peekOn = (peek: Peek, to: Inspect, shown: boolean) => ({
  onPointerEnter: (e: React.PointerEvent) => !shown && peek.hover(to, true, e),
  onPointerLeave: (e: React.PointerEvent) => peek.hover(to, false, e),
});

/** A strip of the drawer's tabs: the arrows, Home and End move focus along
 * it from the one in the tab order (the tab it shows, or last showed);
 * Enter or Space picks the focused one, as a click. Moving picks nothing,
 * so it never opens the drawer */
function onTabKeys(event: React.KeyboardEvent<HTMLElement>) {
  // modified keys keep their own meaning (Alt+← is Back)
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const tabs = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
  ];
  const at = tabs.indexOf(event.target as HTMLElement);
  if (at < 0) return;
  const step =
    event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1
    : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1
    : 0;
  const to =
    event.key === 'Home' ? 0
    : event.key === 'End' ? tabs.length - 1
    : step ? (at + step + tabs.length) % tabs.length
    : -1;
  if (to < 0) return;
  event.preventDefault();
  tabs[to].focus();
}

const tabIcon = (tab: Inspect) =>
  tab === 'store' ? <StoreIcon /> : <LogsIcon />;
export const tabLabel = (tab: Inspect) =>
  tab === 'store' ?
    translate({ id: 'playground.store', message: 'Store' })
  : translate({ id: 'playground.actions', message: 'Actions' });
const tabTitle = (tab: Inspect, shown: boolean) =>
  tab === 'store' ?
    shown ? translate({ id: 'playground.store.hide', message: 'Hide Store' })
    : translate({ id: 'playground.store.show', message: 'Show Store' })
  : shown ?
    translate({ id: 'playground.actions.hide', message: 'Hide Actions' })
  : translate({ id: 'playground.actions.show', message: 'Show Actions' });

/** A log: rows of entries, each marked at its start (Lucide `logs`) */
function LogsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 12h8M13 18h8M13 6h8M3 12h1M3 18h1M3 6h1M8 12h1M8 18h1M8 6h1" />
    </svg>
  );
}

/** Angle brackets around a slash */
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </svg>
  );
}
