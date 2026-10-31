import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import React, {
  Activity,
  memo,
  useDeferredValue,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import type { PreviewProps } from '../types';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { heldToggle, StoreToggle, useLook } from './StoreToggle';

function StoreInspector({
  toggle,
  open,
  registry,
  history,
  row,
  host,
}: {
  open: boolean;
  toggle: PreviewProps['toggleStore'];
  registry: SchemaRegistry;
  history: number;
  /** On the preview's folder (`host`), which opens over the code, instead
   * of beside the result; its toggle is the folder's tab (../index.tsx) */
  row: boolean;
  host: HTMLElement | null;
}) {
  // the empty drawer starts moving at once; the tree renders a frame later,
  // then stays, so reopening finds the Store as it was left. A row Store
  // renders it with the click instead: where the row playground stacks, that
  // Store grows to fit the tree, and growing a frame later would move the
  // page after the click's scroll hold. Beside the result, its height follows
  // the result, not the tree
  const deferred = useDeferredValue(open);
  // a tab's quick look shows from the panel, mounting it if it never was
  const looking = !!useLook();
  const ready = (row ? open : deferred) || looking;
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  // the quick look goes on the drawer's panel, in its palette
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const tree =
    showTree ?
      <StorePanel registry={registry} history={history} lookHost={panelEl} />
    : null;
  if (row) {
    return (
      host &&
      createPortal(
        <FolderPanel open={open} host={host} peeking={looking} ref={setPanelEl}>
          {tree}
        </FolderPanel>,
        host,
      )
    );
  }
  return (
    <>
      <StoreToggle onToggle={toggle} open={open} />
      <Reveal show={open} className={styles.storePanel} hold={heldToggle}>
        {tree}
      </Reveal>
    </>
  );
}
export default memo(StoreInspector);

/** The Store on the preview's folder (`host`), which sweeps open over the
 * code and shut again in CSS (`data-open`, see .storeHost in
 * ../styles.module.css): the tree stays shown until the sweep has shut,
 * then hides (an `<Activity>`, so reopening finds it as it was left) and
 * leaves the layout, with the toggle that shut it held in place on screen,
 * as `Reveal` does for the Store beside the result */
function FolderPanel({
  open,
  host,
  peeking,
  ref,
  children,
}: {
  open: boolean;
  host: HTMLElement;
  ref: React.Ref<HTMLDivElement>;
  /** A tab's quick look shows, from the panel: it stays visible to the
   * look, though shut */
  peeking: boolean;
  children: React.ReactNode;
}) {
  const [shut, setShut] = useState(!open);
  if (open && shut) setShut(false);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  useEffect(() => {
    if (open || shut) return;
    let reopened = false;
    // the sweep is a transition this commit's styles started: it is running
    // by the next frame (none under reduced motion: shut at once)
    const frame = requestAnimationFrame(() => {
      Promise.allSettled(host.getAnimations().map(a => a.finished)).then(() => {
        if (reopened) return;
        const held = heldToggle();
        if (held) blockElementScrollPositionUntilNextRender(held);
        setShut(true);
      });
    });
    return () => {
      reopened = true;
      cancelAnimationFrame(frame);
    };
  }, [open, shut, host, blockElementScrollPositionUntilNextRender]);
  return (
    <div
      ref={ref}
      className={styles.storePanel}
      data-visible={!shut || undefined}
    >
      <Activity mode={shut && !peeking ? 'hidden' : 'visible'}>
        {children}
      </Activity>
    </div>
  );
}
