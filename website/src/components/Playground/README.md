# Playground

Live, editable code examples for the docs, blog and homepage. Most of the
complexity here keeps pages fast, indexable and hydration-safe, and each of
those breaks silently: nothing fails in dev when the Store ships in every
docs page chunk or a crawler gets an empty frame. Read this before changing
code under this directory, then run the checks under Verify.

## Where to change what

`../HooksPlayground.tsx` (MDX, and the homepage's `../Demo/CodeEditor.tsx`)
renders `index.tsx`. `../TypeScriptEditor.tsx` and
`../HTTP/EndpointPlayground.tsx` reuse `editor/EditorSurface.tsx`
(`variant="standalone"`); `../DiffEditor.tsx` reuses `editor/codeModel.ts`
and `editor/callouts.ts`.

| Task                                                | Where                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Props, layouts, Store placement, hidden handling    | `index.tsx` (`PlaygroundProps` documents each prop)                                                                                                                     |
| Fence metastring, file list                         | `editor/codeModel.ts`                                                                                                                                                   |
| Editor chrome: tabs, headers, collapse, SSR markup  | `editor/EditorSurface.tsx`, `editor/StaticEditor.tsx`, `editor/InteractiveEditor.tsx`                                                                                   |
| Monaco: types, completions, go-to-definition, theme | `monaco/`; `editor-types/` and `monaco/preloadManifest.ts` are generated (see JS delivery)                                                                              |
| Running the code, scope globals                     | `preview/LivePreview.tsx`, `preview/useCodeManagers.ts`, `preview/transformCode.ts`, `preview/scope.ts`                                                                 |
| Preview frame, Store open state and motion          | `preview/PreviewWrapper.tsx`, `preview/StoreToggle.tsx`, `preview/StoreInspector.tsx`, `styles.module.css`                                                              |
| Store inspector UI                                  | `preview/store/`: `StorePanel.tsx` owns navigation (`nav.tsx`), `actionLog.ts` records, `actionGroups.ts` groups, `attribution.ts` names the manager behind each action |
| Managers the code declares                          | `preview/managers.ts`; [data flow](./managers-data-flow.png) (source `managers-data-flow.svg`)                                                                          |
| Multi-page demos                                    | `preview/router.tsx`                                                                                                                                                    |
| Demo markup's look                                  | `DesignSystem/design-system.css` (tokens and skeletons in `base.css`)                                                                                                   |
| Self-playing demos                                  | `preview/autorun/`                                                                                                                                                      |
| Mobile and crawler gates                            | `userAgent.ts`                                                                                                                                                          |
| Docusaurus stubs for tests                          | `testing/` (mapped in the root `jest.config.js`)                                                                                                                        |

`resources/` is referenced by nothing.

## Invariants

### Hydration and crawlers

- Open files' source is in the static HTML: `TextEditTab` renders
  `StaticEditor` on the server and as the `BrowserOnly` fallback. Collapsed
  files render nothing (HTML size), unless the element has `ssr` (an element
  prop, not a metastring; Demo passes it): then their plain text is in the
  HTML, hidden by CSS, for crawlers.
- The preview renders `PreviewLoading` (frame, loading page, Store toggle) on
  the server, while loading, for bots and while `hidden`.
- Loading goes straight to loaded. The page's first paint, the chunk
  loading and the app waiting on data all draw `preview/PendingSheet.tsx`,
  and `PreviewHeaderControls` gives the loading and live headers the same
  controls, so nothing moves in between. In `row`, the loading page has a
  fixed height (`--pg-pending-sheet`), so CSS knows where the folder ends
  before hydration; keep it equal to what `usePreviewGap` then measures.
- Never branch on `navigator` or the user agent during render outside
  `BrowserOnly`: both gates are false on the server, so the markup would
  mismatch. `isBot` is read only in the `lazy()` factory (and by StackBlitz
  after intersection); `isMobileOrBot()` only inside `BrowserOnly` or in
  `monaco/setup.ts`.
- Fixture function sources wait for `useIsBrowser`: a stringified function
  differs between the server and browser bundles.

### JS delivery

- `preview/` is the lazy `PreviewWithScope` chunk (`PreviewBlock` nested in
  it, preloaded with its parent). From outside it, import only with
  `import()`, `import type`, or from a file listed in `EAGER_PREVIEW`
  (`eslint.config.mjs`); those render in SSR and loading states and may not
  statically import the rest of `preview/`. ESLint can't see MDX or a
  `splitChunks` change, so `website/scripts/check-lazy-chunks.mjs` (the
  `website` GitHub job, after the build) fails when the Store UI ships
  outside that chunk.
- `website/chunks-plugin.js` shares site modules used by 2+ pages; Docusaurus
  alone shares only modules used by half of all pages, so the eager
  Playground modules would be copied into every docs page chunk.
- `monaco/setup.ts` runs once when the editor chunk evaluates (resource
  hints, `loader.init()`, type libs in parallel) and does nothing for mobile
  or bots, so they download none of Monaco. `monaco/preloadManifest.ts` is
  generated from the installed `monaco-editor` on install and on every
  docusaurus config load, and gitignored.
- Type libs: one chunk per third-party `.d.ts`, one `dataClientDTS` chunk
  holding exactly `DATA_CLIENT_LIBS` (check-only types like `vue/test` stay
  out). A failed fetch degrades to an empty lib.
- `editor-types/` is generated by `yarn copy:websitetypes`; the `regenerate`
  workflow fails when it is stale. Don't hand-edit it.

### Mobile and bots

- Mobile: an editable react-live editor instead of Monaco; the preview runs.
- Bots: the same editor; the preview stays `PreviewLoading` and StackBlitz
  embeds never load.
- `DiffEditor` falls back to two `CodeBlock`s with callout markers appended
  as comments; caption and callout legend render outside the editor so they
  are in the HTML whether or not Monaco loads.

### Hidden playgrounds (protocol tabs)

All tabs stay mounted so every protocol's source is in the HTML. `hidden`
keeps `StaticEditor` until first shown, then latches interactive so undo
history and go-to-definition survive tab switches. The live preview unmounts
while hidden, so its store resets. The homepage passes `hidden` directly; in
MDX, `PlaygroundTabs` sets it through `PlaygroundHiddenContext`
(`hiddenContext.ts`) for every playground under an unselected tab, nested tab
groups included. An explicit `hidden` prop wins.

### Layouts

`index.tsx` picks `demo`, else `row`, else stacked. Tests:
`__tests__/rowLayout.test.tsx`, `__tests__/demoLayout*.test.tsx`.

- Fence metastring: `title`, `path` (quotes optional), `collapsed`, `column`,
  `route`, `start`, `layout`, `{1-3}` (pre-selected in Monaco) and the
  `language-*` class. Element props override metastring values (Demo passes
  them); `defaultTab` overrides `collapsed`.
- Stacked: every titled file has a header, collapsible when there are several
  files or fixtures; fixtures list above the editor (the other layouts fold
  them into the preview header).
- `row`: files are tabs over the code card (`column` files stack with
  headers); the preview is a folder beside it (under it below a 720px
  container width) with the Store on a layer behind it (`.storeHost` >
  `.storeDrawer`, `StoreTab` as the handle). Open, the drawer slides over the
  code and its file tabs, which go `inert`. `PreviewWrapper` measures
  `--pg-preview-gap` so the folder ends at the sheet's foot.
- `demo`: preview first, full width; the code waits behind the header's Code
  toggle and takes the result's place (`data-code` on the container). Never
  code and result together, and never code and Store: the Store toggle over
  the code brings the result back. The result stays mounted so app state
  survives; both share `--pg-demo-min` so toggling doesn't move the page.
  The Code toggle counts as reader input, so it ends an `autoRun`.

### Editor

- Collapsed files stay mounted (`display: none`), never unmounted: their
  Monaco models carry cross-file types, go-to-definition and edits. Monaco
  is uncontrolled (`defaultValue`), so re-renders never reset the buffer.
- Handlers passed to `InteractiveEditor` are referentially stable
  (`EditorSurface`), which is what lets `memo` skip unedited tabs on
  keystrokes; `useDefinitionOpener` reads `onOpen` once.
- `monaco/models.ts` creates a surface's models in one synchronous pass and
  relies on the TS worker answering in order. No test runs against real
  Monaco, so after a `monaco-editor` bump open a multi-file playground after
  page load (a second homepage tab) whose importing file comes before the
  file it imports, and check for no TS2307 (Cannot find module) marker.
- Go-to-definition and Store links (`reveal`) only ask for the tab;
  selection and focus wait until it is visible, since a `display: none`
  editor can't take focus. For the same reason `openCode` (`index.tsx`)
  closes a covering Store in the same render as it hands the line over.

### Running the code

- Documents are joined with `\n;\n` (a half-typed statement can't absorb the
  next file), deferred with `useDeferredValue`, stripped of imports and
  exports (`transformCode`), wrapped in one `{}` block (so a demo can declare
  its own `Link` or `Avatar` with `const` or `class`, which a scope parameter
  would forbid) and run `noInline` with `render(<App />)`. Files share the
  block, so two can't declare the same name.
- Scope globals and their types live apart. A design-system export is picked
  up from `DesignSystem/index.ts` by `preview/scope.ts` and by
  `website/framework-docs/checkExamples.mjs`; declare its type by hand in
  `monaco/typeLibs.ts` (`PREVIEW_SCOPE_DECLARATIONS`). Any other global goes
  in all three. `globalScopeLib()` aliases library exports into
  `declare global`, skipping `Array` and `Object` so the built-ins keep
  their types.
- Each playground has its own `DataProvider` with `MockResolver(fixtures)`;
  `memo(Preview)` keeps it from re-rendering on code edits, so what reaches
  it must be stable.

### Store inspector

- Open state persists per `groupId` (tab storage); closing one Store closes
  every playground's in the group, and toggling blocks the page's scroll
  position.
- Motion invariant: the Store animates only while the reader or a demo moves
  it. `useStoreOpen` counts those moves, `useStoreMotion` turns them into
  `data-store-moving` on the container, which alone gives `--pg-store-*`
  their durations, and the stacked `MotionGroup` keys on the same count.
  Everything else (the saved choice arriving at hydration, a tab showing the
  playground, a resize, another Store in the group closing this one) must
  land without animating. `preview/__tests__/StoreMotion.test.tsx` checks it.
- Row: `StoreInspector` portals into the drawer (`FolderPanel`, an
  `<Activity>` hidden once the sweep has shut, so reopening finds the Store
  as it was left). Other layouts: a `Reveal` beside the result (see
  `../motion/README.md`); the tree renders a frame after the drawer starts
  moving (`useDeferredValue`).
- Log: `Preview.tsx` connects `registry.log` once per store mount with
  `log.head` first and `log.tail` last. Keep that order when adding
  managers: the head credits each action to the manager that sent it, the
  tail must see exactly what reaches the store. `usePreviewReset` owns the
  `history` id: a fresh store starts a new one, a store the retry restores
  continues its own. `DOCS_LOG` (`index.tsx`) shortens the log's defaults
  because a page holds several playgrounds; the `actionLog` prop overrides
  it per playground.
- Navigation (`preview/store/nav.tsx`, all state owned by `StorePanel`): the
  moment (a `Step`, or `null` for live) moves only through `stepAt`
  (`actionLog.ts`) and `pickAt` (`actionGroups.ts`); `unitOf` is the one
  owner of what a `scope` spans. Rows render again only when their own group
  changes: keep `GroupRow` memoized and `subjectFilter`'s result stable.
  Timeline marks are fractions of the track (`--tl-f`), never measured.
  ← → reach the panel only when the focused element has no use for them
  (`usesArrows`).

### Multi-page demos

A fence with `route="/posts/:id"` is a page: its default export, the path's
params as props. When any file has one, `routerTrailer` appends the
`render()`, so no file calls it. A `layout` fence wraps every page and stays
mounted; `start` opens the router somewhere other than `/`. Pages move with
the scope's `Link` and `useNavigate()`; navigation is already a transition
with a progress bar, so pages need no `startTransition`. A reset starts over
at `start`. Vue examples don't run; `checkExamples.mjs` declares
`RouterLink` and `RouterView` for them.

### Reset and errors

- A render error right after an edit retries once with a fresh store (a
  changed `Entity.key` leaves old data unreadable); if it persists the old
  store comes back, and no retry runs until a clean render has held for
  `HEALTHY_AFTER_MS`, so typing through a typo costs at most one retry.
  Compile and evaluation errors never reset.
- `ErrorPanel` names the failed stage: compile (react-live `SyntaxError`, the
  code never ran), runtime, or manager (the preview runs on without that
  manager). Demos rely on this reset instead of their own store-clearing
  fallbacks; say so in the prose beside a demo that needs it.
- `usePlaygroundConsoleDemotion` demotes only React's recreate-tree report
  while previews are mounted. Never add matchers for `@data-client/*` or
  first-party code: fix the source.

### Managers

- `getManagers()` in the code sets the store's managers (otherwise
  `getDefaultManagers({ devToolsManager: null })`). Only editing the file
  that defines it, or a file declaring a name it uses, remounts the store
  with its data; other edits keep sockets open. Code that fails to run keeps
  the old managers.
- A kept manager closes over the run that built it, not the UI's latest, so
  it reaches the UI only through what every run shares: the store, or a
  design-system module such as `toast`.
- Attribution matches library managers by exact class, so a playground's
  subclass counts as its own code and links to its declaration
  (`ManagerName`).

### renderCount

The badge is a `<Profiler>` commit count written straight to the DOM, so
counting adds no commits. It depends on `website/profiling-plugin.js`
swapping `react-dom/client` for React's profiling build (production never
calls `onRender`) and `website/profiling-loader.js` pinning the DevTools
check off (otherwise visitors with DevTools would profile every page). The
badge stays hidden while `onRender` never fires, so a broken swap shows
nothing rather than a wrong count.

### Design system

`DesignSystem/design-system.css` is scoped to `.playground-preview` and loads
with the preview; its tokens (`--ds-*`, reading the frame's `--pg-*`) and
skeletons (`base.css`) load with the Playground, so the first paint shows the
app's own loading page (`preview/PendingSheet.tsx`). Doc examples use plain
elements and these classes, never inline styles or style imports, so a look
changes in one place. Space separates things, not lines: add no borders or
dividers (only form controls keep an edge). Before restyling a class, grep
`docs/` and `website/src/components/Demo/code` for the demos using it. Prefer
a class or element style to a new component.

Elements are styled: `h2` is a page title; plain `button`s (`primary` fills
one; `aria-busy` traces a pending light), text inputs, `nav`, `fieldset`.

| Class                                      | Use for                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `appHeader` + `appTitle`                   | the app's top bar and wordmark                                                   |
| `card`                                     | a group (no box: the sheet is the card)                                          |
| `list`, `listItem` (`nogap`, `spaced`)     | rows; checkbox rows highlight and fade when done                                 |
| `meta`                                     | secondary text; last in a `listItem`, it sits at the row's end                   |
| `byline`, `author` (`Avatar` takes `size`) | who wrote something                                                              |
| `buttonGroup`                              | a row of actions as one segmented control                                        |
| `cancel` (`<CancelButton />`)              | a row's remove button                                                            |
| `skeleton`                                 | a value still loading; `<Loading />`, the default fallback, draws a page of them |
| `toaster`, `toast`                         | notifications: render `<Toaster />`, call `toast.success()` or `toast.error()`   |
| `boardColumn`                              | a kanban column                                                                  |
| `voteBlock`, `vote`                        | a vote count with its buttons                                                    |

### Auto-run

A playground with `autoRun` (a `Step[]`, `preview/autorun/script.ts`) plays
it the first time 60% of its preview (or of the viewport, for a taller
preview) is in view, never under reduced motion. The "Live Preview" label
becomes its control (`DemoLabel`): pressing it replays from a fresh store.
`player.ts` owns timing, `stage.ts` the DOM (locators, untrusted events, the
pointer), `useAutoRun.ts` connects them to the preview's ref.

Writing a script:

- Declare it as a module-level `export const` (like `raceDemo` in
  `docs/rest/shared/_optimisticTransform.mdx`): "plays by itself once per
  page load" is keyed by array identity, so an inline `autoRun={[…]}` plays
  again whenever the page's framework is switched away and back.
- Target Store UI with `in: 'store'` (the default scope is the preview).
  Match `aria-label`s and `data-*` attributes over visible text, which copy
  edits change.
- The Store opens in the reader's saved view, so a script whose targets only
  one view shows names it: `{ store: 'open', view: 'table' }` for
  `[data-table]` rows. Neither the open nor the view is saved.
- A target missing after `FIND_TIMEOUT` ends the run, and only the console
  says so (`Playground demo:`). Play every new or edited script in a
  browser, at a phone width too, where the Store opens above the preview.
- Step counts follow the fixtures (`raceDemo` presses Next once per change
  its clicks make), so changing a fixture means recounting.

Behavior to keep when changing the player:

- The reader's own input (`isTrusted`) anywhere in the playground ends the
  run for good, since the rest of the script assumes a state they just
  changed. Scrolling, hovering, a touch that starts a scroll and the demo's
  own controls (`data-autorun-control`) don't count.
- It pauses while neither the preview nor the playground is mostly in view,
  or the tab is in the background, so it never scrolls the page back to a
  reader who scrolled past.
- It never calls `focus()`, which would take the page's focus from the
  reader, and its state reaches React only in `DemoLabel`, so a run never
  re-renders the playground.

## Verify

- Unit tests:
  `yarn test --selectProjects ReactDOM --testPathPatterns website/src/components/Playground`.
  CI persists only `Playground/`, `motion/` and `utils/` of the website for
  these, without the website's dependencies; `react-live` is a root
  devDependency so `PreviewError.test.tsx` can pin the react-live behavior
  it relies on.
- Lazy-import rule: `yarn lint website/src/components/Playground`.
- Chunk check, as the `website` job runs it:
  `yarn workspace rdc-website build && node website/scripts/check-lazy-chunks.mjs`.
- Docs examples still type-check against the scope:
  `yarn workspace rdc-website check:doc-examples`.
- In a browser: the TS2307 check after a `monaco-editor` bump (Editor), and
  any changed auto-run script at desktop and phone widths.
