import clsx from 'clsx';
import React, {
  lazy,
  useCallback,
  useDeferredValue,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import Boundary from './Boundary';
import { useCodeDocuments } from './editor/codeModel';
import { declarationsOf, keepSameDeclarations } from './editor/declarations';
import EditorSurface from './editor/EditorSurface';
import {
  CodeOpenerContext,
  type CodeOpener,
  type CodeTarget,
} from './editor/openCode';
import type { AutoRunScript } from './preview/autorun/script';
import FixturePreview from './preview/FixturePreview';
import type LivePreviewType from './preview/LivePreview';
import PendingSheet from './preview/PendingSheet';
import PreviewWrapper, {
  PreviewHeaderControls,
  previewSurfaceClassName,
} from './preview/PreviewWrapper';
import type { LogOptions } from './preview/store/actionLog';
import {
  DemoViewContext,
  StoreTab,
  StoreToggle,
  useStoreMotion,
  useStoreOpen,
} from './preview/StoreToggle';
import styles from './styles.module.css';
import type { CodeControl, FixtureOrInterceptor } from './types';
import { isBot } from './userAgent';

export interface PlaygroundProps<T = any> {
  children: React.ReactNode;
  /** Tab-storage key for the Store inspector's open/closed choice */
  groupId?: string;
  /** Store inspector open by default */
  defaultOpen?: 'y' | 'n';
  /** Files as tabs over a code card, the preview a folder beside it (when
   * wide enough; under it otherwise), with the Store behind the preview: its
   * tab opens it over the code. Use when the code is one tall open file and
   * the preview is short; row folds fixtures behind a toggle in the
   * preview's header. Stay stacked when the Store opens by default (it would
   * cover the code), or when the preview renders a long list (it gets tall
   * in the narrow column). */
  row?: boolean;
  /** Preview first, at full width, with room for a realistic app; the code
   * waits behind a Code toggle in its header (file tabs like `row`) and
   * takes the preview's place while it shows. Use when the point is what
   * happens on screen, not the code, or the app needs the room. The Store
   * opens beside the result as when stacked; `row` is ignored. */
  demo?: boolean;
  /** Inactive (e.g. unselected Demo tab): no Monaco until first shown, no preview */
  hidden?: boolean;
  fixtures?: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
  /** Title of the file tab to open; overrides `collapsed` metastrings */
  defaultTab?: string;
  /** Show a badge counting the preview's React commits (e.g. one notification vs N) */
  renderCount?: boolean;
  /** How the Store's action log records (e.g. `{ recordFrom: 'open' }` for
   * a fast stream), over `DOCS_LOG` */
  actionLog?: LogOptions;
  /** A demo the preview plays by itself once in view (its Live Preview label
   * replays it). Declare it once at module level: its identity keys the
   * once-per-page autostart. */
  autoRun?: AutoRunScript;
}

/** A page holds several playgrounds: each keeps a short history (a
 * devtool for a whole site would keep more, the log's own defaults) */
const DOCS_LOG: LogOptions = { limit: 150, updateLimit: 10, trimEvery: 25 };

export default function Playground<T>({
  children,
  groupId = 'playground',
  defaultOpen = 'n',
  row: rowLayout = false,
  demo = false,
  hidden = false,
  fixtures = [],
  getInitialInterceptorData,
  defaultTab,
  renderCount = false,
  actionLog: logOptions,
  autoRun,
}: PlaygroundProps<T>) {
  // read once, as the preview first builds its log
  const actionLog = { ...DOCS_LOG, ...logOptions };
  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  const documents = useDeferredValue(model.documents);

  const layout =
    demo ? 'demo'
    : rowLayout ? 'row'
    : 'stacked';
  const row = layout === 'row';
  const [storeOpen, toggleStore, showStore, demoView, storeMoves] =
    useStoreOpen(groupId, defaultOpen);
  // the Store animates only while the reader or a demo moves it, never as
  // the playground shows or its layout changes
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const storeMoving = useStoreMotion(container, storeMoves, storeOpen);
  // Row layout: the preview is a folder with the Store behind it, which its
  // handle pulls out over the code (the folder's layer, .storeHost), leaving
  // the preview usable
  const [storeHost, setStoreHost] = useState<HTMLDivElement | null>(null);
  const storeId = useId();
  const codeCovered = row && storeOpen;
  // the folder's handle: Escape anywhere on the folder pushes it shut
  const handle = useRef<HTMLButtonElement>(null);
  const shutStore = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || !storeOpen) return;
    const tab = handle.current;
    if (!tab) return;
    event.preventDefault();
    toggleStore({ currentTarget: tab });
    tab.focus();
  };

  // Demo layout: the code takes the result's place while shown
  const [codeShown, setCodeShown] = useState(false);
  // the Store lives with the result, so over a demo's code its toggle brings
  // the preview back along with what it says (Show Store, Hide Store); with
  // no code shown that is a no-op
  const toggleStoreInPreview = useCallback(
    (event: { currentTarget: HTMLElement }) => {
      setCodeShown(false);
      toggleStore(event);
    },
    [toggleStore],
  );

  // the line the Store last asked to show: a new object per ask, so asking
  // for the same line again shows it again
  const [codeTarget, showCode] = useState<CodeTarget | null>(null);
  const openCode = useCallback(
    (target: CodeTarget) => {
      // in the same render, so the code is no longer inert by the time its
      // editor takes focus
      if (codeCovered) showStore(false);
      setCodeShown(true);
      showCode({ ...target });
    },
    [codeCovered, showStore],
  );
  // from the code the preview runs, so the Store's links change with it;
  // kept while no declaration moves, so an edit elsewhere renders no link
  const lastDeclared = useRef<CodeOpener['declared']>(new Map());
  const declared = useMemo(
    () =>
      (lastDeclared.current = keepSameDeclarations(
        lastDeclared.current,
        declarationsOf(documents),
      )),
    [documents],
  );
  const codeOpener = useMemo<CodeOpener>(
    () => ({ declared, open: openCode }),
    [declared, openCode],
  );

  // Until first shown (a demo's code is first shown by its Code toggle) the
  // code is plain text in the HTML; then Monaco hydrates and stays
  // (preserves undo / go-to-def).
  const codeVisible = !hidden && (!demo || codeShown);
  const [editorInteractive, setEditorInteractive] = useState(codeVisible);
  if (codeVisible && !editorInteractive) setEditorInteractive(true);
  const toggleCode = useCallback(() => setCodeShown(shown => !shown), []);

  const fixtureContent =
    fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined;
  // folded into the preview's header (row, demo), the fixtures render once
  // the pointer or focus reaches the playground, not in the HTML (or the
  // page) before: in time for the toggle's hover preview to fade in. Until
  // then `false` holds the toggle's place
  const [fixturesNear, setFixturesNear] = useState(false);
  const previewFixtures =
    layout === 'stacked' || !fixtureContent ? undefined
    : fixturesNear ? fixtureContent
    : false;
  const nearFixtures =
    previewFixtures === false ? () => setFixturesNear(true) : undefined;

  const editor = (
    <EditorSurface
      {...model}
      interactive={editorInteractive}
      layout={layout}
      variant="playground"
      fixtureContent={fixtureContent}
      covered={codeCovered}
      reveal={codeTarget}
    />
  );
  // the demo layout's Code toggle: in the preview's header whether or not
  // the live preview has loaded
  const code: CodeControl | undefined =
    demo ? { shown: codeShown, toggle: toggleCode } : undefined;
  // Live preview only while visible — unmounts when hidden (resets store);
  // hidden, not even its frame is in the HTML
  const preview =
    hidden ? null : (
      <Boundary
        fallback={
          <PreviewLoading
            row={row}
            fixtureContent={previewFixtures}
            code={code}
          />
        }
      >
        <DemoViewContext.Provider value={demoView}>
          <CodeOpenerContext.Provider value={codeOpener}>
            <LivePreview
              documents={documents}
              fixtureContent={previewFixtures}
              storeOpen={storeOpen}
              toggleStore={toggleStoreInPreview}
              row={row}
              storeHost={storeHost}
              fixtures={fixtures}
              getInitialInterceptorData={getInitialInterceptorData}
              renderCount={renderCount}
              actionLog={actionLog}
              autoRun={autoRun}
              showStore={showStore}
              storeMoves={storeMoves}
              code={code}
            />
          </CodeOpenerContext.Provider>
        </DemoViewContext.Provider>
      </Boundary>
    );

  return (
    <div
      // where the demo (autoRun) acts
      data-playground
      className={clsx(styles.playgroundQueryContainer, {
        [styles.hidden]: hidden,
      })}
    >
      <div
        ref={setContainer}
        className={clsx(styles.playgroundContainer, {
          [styles.row]: row,
          [styles.demo]: demo,
        })}
        data-code={(demo && codeShown) || undefined}
        data-store-moving={storeMoving || undefined}
        onPointerOver={nearFixtures}
        onFocus={nearFixtures}
      >
        {demo ?
          <>
            {preview}
            {editor}
          </>
        : <>
            {editor}
            {preview}
          </>
        }
        {row && !hidden ?
          <div
            id={storeId}
            className={styles.storeHost}
            data-open={storeOpen || undefined}
          >
            <div
              ref={setStoreHost}
              className={styles.storeDrawer}
              onKeyDown={shutStore}
            >
              <StoreTab
                ref={handle}
                open={storeOpen}
                onClick={toggleStore}
                controls={storeId}
              />
            </div>
          </div>
        : null}
      </div>
    </div>
  );
}

/** SSR, crawler and loading state: the preview's frame with a blank
 * sheet + Store toggle (the side strip; the row layout's is the folder's
 * handle, rendered with the folder above), and row's fixtures, already
 * usable; so is a demo's Code toggle. The reset holds its place, disabled */
function PreviewLoading({
  row,
  fixtureContent,
  code,
}: {
  row: boolean;
  fixtureContent?: React.ReactNode;
  code?: CodeControl;
}) {
  return (
    <PreviewWrapper
      headerControls={<PreviewHeaderControls row={row} />}
      fixtures={fixtureContent}
      code={code}
    >
      <div className={previewSurfaceClassName}>
        <PendingSheet />
      </div>
      {row ? null : <StoreToggle />}
    </PreviewWrapper>
  );
}

const LivePreview = lazy<typeof LivePreviewType>(() =>
  isBot ?
    Promise.resolve({ default: PreviewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './preview/LivePreview'
    ),
);
