import clsx from 'clsx';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { SubjectChanges, whatFields } from './ActionDetail';
import type { LogEntry } from './actionLog';
import { ActionName, Time } from './actionParts';
import type { View } from './nav';
import { plain } from './refs';
import styles from './store.module.css';
import { Inline } from './Value';

/** How long the mouse is on a track before its preview shows (ms); once
 * shown, it follows the mouse at once */
const SHOW_MS = 150;
/** Back on a track this soon after leaving one, the preview shows at once
 * (ms), so going from the scrubber to the lanes doesn't wait again */
const WARM_MS = 300;

/** An action to preview, from a track */
export interface PreviewAt {
  readonly entry: LogEntry;
  /** Client px of its mark */
  readonly x: number;
  /** What the preview shows under */
  readonly anchor: HTMLElement;
}
/** Shows the preview of an action (`now`, without the wait), or hides it */
export type OnPreview = (at: PreviewAt | null, now?: boolean) => void;

/** Where the preview shows, in the panel's px */
interface Shown {
  readonly entry: LogEntry;
  readonly anchor: HTMLElement;
  readonly x: number;
  readonly top: number;
}

/** What is previewed. Outside React state, so moving it renders only the
 * preview, not the panel */
export class HoverPreview {
  private shown: Shown | null = null;
  private listeners = new Set<() => void>();
  get = () => this.shown;
  set(shown: Shown | null) {
    if (shown === this.shown) return;
    this.shown = shown;
    this.listeners.forEach(l => l());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

/** The preview over `panel` (for `Preview`) and what tracks call to move
 * it: it waits a moment to show, then follows each action hovered at once */
export function usePreview(panel: React.RefObject<HTMLElement | null>) {
  const [store] = useState(() => new HoverPreview());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Shown | null>(null);
  const last = useRef<PreviewAt | null>(null);
  const hidAt = useRef(-Infinity);
  const onPreview = useCallback<OnPreview>(
    (at, now) => {
      if (!at) {
        clearTimeout(timer.current);
        timer.current = undefined;
        last.current = null;
        if (store.get()) hidAt.current = performance.now();
        store.set(null);
        return;
      }
      // the same action in the same place: nothing to move
      const was = last.current;
      if (was?.entry === at.entry && was.anchor === at.anchor && was.x === at.x)
        return;
      const frame = panel.current?.getBoundingClientRect();
      if (!frame) return;
      last.current = at;
      pending.current = {
        entry: at.entry,
        anchor: at.anchor,
        x: at.x - frame.left,
        top: at.anchor.getBoundingClientRect().bottom - frame.top,
      };
      const show = () => {
        clearTimeout(timer.current);
        timer.current = undefined;
        store.set(pending.current);
      };
      if (store.get() || now || performance.now() - hidAt.current < WARM_MS)
        show();
      // the wait runs from when the mouse came on, however it moves
      else timer.current ??= setTimeout(show, SHOW_MS);
    },
    [panel, store],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [store, onPreview] as const;
}

/** The action previewed: what it is (its name and what it carries), then,
 * when the card has room for all of it, what it did to `subject`. Under the
 * track with a caret on its mark. Only to look at: the pointer passes
 * through, and focus and assistive tech skip it */
export function Preview({
  store,
  subject,
}: {
  store: HoverPreview;
  subject: View;
}) {
  const at = useSyncExternalStore(store.subscribe, store.get, store.get);
  const card = useRef<HTMLDivElement>(null);
  const changes = useRef<HTMLDivElement>(null);
  // what it did shows whole or not at all, never cut off: measured each
  // render, as the action, the subject and the panel's width all change it
  useLayoutEffect(() => {
    const el = changes.current;
    if (!el || !card.current) return;
    el.hidden = false;
    el.hidden = card.current.scrollHeight > card.current.clientHeight;
  });
  if (!at) return null;
  const { entry } = at;
  const what = whatFields(entry.action);
  return (
    <div
      className={styles.preview}
      role="tooltip"
      aria-hidden="true"
      inert
      style={
        {
          '--pv-x': `${at.x}px`,
          '--pv-top': `${at.top}px`,
        } as React.CSSProperties
      }
    >
      <div ref={card} className={styles.previewCard}>
        <div className={styles.actHead}>
          <ActionName entry={entry} />
          <Time at={entry.at} />
        </div>
        {what.length > 0 && (
          <div className={clsx(styles.fields, styles.pvWhat)}>
            {what.map(([name, value]) => (
              <div key={name} className={styles.field}>
                <span className={styles.key}>
                  {name}
                  <span className={styles.dim}>:</span>
                </span>
                <span className={styles.pvValue}>
                  <Inline node={plain(value)} name={name} />
                </span>
              </div>
            ))}
          </div>
        )}
        <div ref={changes} className={styles.pvChanges}>
          <SubjectChanges entries={[entry]} subject={subject} />
        </div>
      </div>
    </div>
  );
}
