import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import clsx from 'clsx';
import React, { useCallback } from 'react';

import { useLayoutMotion } from '../../motion';
import styles from '../styles.module.css';
import { useTabStorage } from '../../../utils/tabStorage';

// Kept apart from StoreInspector: ../index.tsx is statically in every page
// chunk that embeds a Playground, while the Store UI loads with LivePreview

/** Store open state, persisted per `groupId`; toggling keeps the page from scrolling */
export function useStoreOpen(groupId: string, defaultOpen: 'y' | 'n') {
  const [choice, setChoice] = useTabStorage(groupId);
  const open =
    (choice === 'y' || choice === 'n' ? choice : defaultOpen) === 'y';
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  const toggle = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      blockElementScrollPositionUntilNextRender(event.currentTarget);
      setChoice(open ? 'n' : 'y');
    },
    [blockElementScrollPositionUntilNextRender, open, setChoice],
  );
  const close = useCallback(() => setChoice('n'), [setChoice]);
  return [open, toggle, close] as const;
}

/** Toggle row; also rendered (inert) by the preview loading fallback in ../index.tsx */
export function StoreToggle({
  onClick,
  open = true,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  open?: boolean;
}) {
  const ref = useLayoutMotion();
  return (
    <div className={styles.debugToggle} onClick={onClick} ref={ref}>
      Store
      <span
        className={clsx(
          styles.arrow,
          open ? styles.right : styles.left,
          styles.vertical,
        )}
      >
        ▶
      </span>
    </div>
  );
}
