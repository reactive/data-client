import React, { useCallback, useEffect, useRef, useState } from 'react';

import { SubjectChanges } from './ActionDetail';
import { findEntry } from './actionLog';
import { ActionName, Time, useActions } from './actionParts';
import type { View } from './nav';
import styles from './store.module.css';

/** How long the mouse is on a track before its preview shows (ms); once
 * shown, it follows the mouse at once */
const SHOW_MS = 150;
/** Back on a track this soon after leaving one, the preview shows at once
 * (ms), so going from the scrubber to the lanes doesn't wait again */
const WARM_MS = 300;

/** An action to preview, from a track */
export interface PreviewAt {
  readonly seq: number;
  /** Client px of its mark */
  readonly x: number;
  /** What the preview shows under */
  readonly anchor: HTMLElement;
}
/** Shows the preview of an action (`now`, without the wait), or hides it */
export type OnPreview = (at: PreviewAt | null, now?: boolean) => void;

/** Where the preview shows, in `panel`'s px */
interface Shown {
  readonly seq: number;
  readonly x: number;
  readonly top: number;
  /** Px left under `top` */
  readonly room: number;
}

/** The preview over `panel` and what tracks call to move it: it waits a
 * moment to show, then follows each action hovered at once */
export function usePreview(panel: React.RefObject<HTMLElement | null>) {
  const [shown, setShown] = useState<Shown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Shown | null>(null);
  const showing = useRef(false);
  const hidAt = useRef(-Infinity);
  const onPreview = useCallback<OnPreview>(
    (at, now) => {
      if (!at) {
        clearTimeout(timer.current);
        timer.current = undefined;
        if (showing.current) hidAt.current = performance.now();
        showing.current = false;
        setShown(null);
        return;
      }
      const frame = panel.current?.getBoundingClientRect();
      if (!frame) return;
      const top = at.anchor.getBoundingClientRect().bottom - frame.top;
      const was = pending.current;
      // the same action again: nothing to move
      if (
        (showing.current || timer.current) &&
        was?.seq === at.seq &&
        was.top === top
      )
        return;
      pending.current = {
        seq: at.seq,
        x: at.x - frame.left,
        top,
        room: frame.height - top,
      };
      const show = () => {
        timer.current = undefined;
        showing.current = true;
        setShown(pending.current);
      };
      if (showing.current || now || performance.now() - hidAt.current < WARM_MS)
        show();
      // the wait runs from when the mouse came on, however it moves
      else timer.current ??= setTimeout(show, SHOW_MS);
    },
    [panel],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [shown, onPreview] as const;
}

/** The action previewed and what it did to `subject`, under the track with
 * a caret on its mark. Only to look at: the pointer passes through */
export function Preview({ at, subject }: { at: Shown; subject: View }) {
  const { history } = useActions();
  const entry = findEntry(history.entries, at.seq);
  if (!entry) return null;
  return (
    <div
      className={styles.preview}
      role="tooltip"
      aria-hidden="true"
      style={
        {
          '--pv-x': `${at.x}px`,
          '--pv-top': `${at.top}px`,
          '--pv-room': `${at.room}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.previewCard}>
        <div className={styles.previewHead}>
          <ActionName entry={entry} />
          <Time at={entry.at} />
        </div>
        <SubjectChanges entries={[entry]} subject={subject} />
      </div>
    </div>
  );
}
