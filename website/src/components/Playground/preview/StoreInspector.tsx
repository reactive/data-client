import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import React, {
  Activity,
  memo,
  useContext,
  useDeferredValue,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import { storeOnFolder, type Layout, type PreviewProps } from '../types';
import { QuickLookHost, useQuickLookShown } from './inspector';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { heldToggle, StoreToggle } from './StoreToggle';

function StoreInspector({
  toggle,
  open,
  registry,
  history,
  layout,
  host,
  narrow,
}: {
  open: boolean;
  toggle: PreviewProps['toggleStore'];
  registry: SchemaRegistry;
  history: number;
  /** `layout === 'row'` (and stacked while `narrow`): on the preview's
   * folder (`host`), which opens over the code, its toggle the folder's tab
   * (../index.tsx). Otherwise beside the result, toggled from the preview's
   * header, and by the side strip in `demo` */
  layout: Layout;
  host: HTMLElement | null;
  narrow: boolean;
}) {
  // the empty drawer starts moving at once; the tree renders a frame later,
  // then stays, so reopening finds the Store as it was left. A folder's Store
  // renders it with the click instead: where the playground stacks, that
  // Store grows to fit the tree, and growing a frame later would move the
  // page after the click's scroll hold. Beside the result, its height follows
  // the result, not the tree
  const folder = storeOnFolder(layout, narrow);
  const deferred = useDeferredValue(open);
  // a tab's quick look shows from the panel, mounting it if it never was
  const quickLookShown = useQuickLookShown();
  const ready = (folder ? open : deferred) || quickLookShown;
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  // the quick look goes on the drawer's panel, in its palette: beside the
  // folder's handles, or under them while open; else on the result, under
  // its tabs (PreviewWrapper's `QuickLookHost`)
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const quickLookHost = useContext(QuickLookHost);
  const onPanel = folder && (open || !narrow);
  const tree =
    showTree ?
      <StorePanel
        registry={registry}
        history={history}
        quickLookHost={onPanel ? panelEl : quickLookHost}
      />
    : null;
  if (folder) {
    return (
      host &&
      createPortal(
        <FolderPanel
          open={open}
          host={host}
          quickLookShown={quickLookShown}
          ref={setPanelEl}
        >
          {tree}
        </FolderPanel>,
        host,
      )
    );
  }
  return (
    <>
      {layout === 'demo' ?
        <StoreToggle onToggle={toggle} open={open} />
      : null}
      <Reveal
        show={open}
        className={styles.storePanel}
        hold={heldToggle}
        active={quickLookShown}
      >
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
  quickLookShown,
  ref,
  children,
}: {
  open: boolean;
  host: HTMLElement;
  ref: React.Ref<HTMLDivElement>;
  /** A tab's quick look shows, from the panel: it stays visible to the
   * quick look, though shut */
  quickLookShown: boolean;
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
      <Activity mode={shut && !quickLookShown ? 'hidden' : 'visible'}>
        {children}
      </Activity>
    </div>
  );
}
