# Playground

Live, editable code examples for the docs, blog and homepage. Most of the
code keeps pages fast, indexable and hydration-safe, and those break
silently: nothing fails in dev when the Store ships in every docs page chunk
or a crawler gets an empty frame. Read this before changing code here, then
run [Verify](#verify).

## Where to change what

`../HooksPlayground.tsx` (MDX, and the homepage's `../Demo/CodeEditor.tsx`)
renders `index.tsx`. `../TypeScriptEditor.tsx` and
`../HTTP/EndpointPlayground.tsx` reuse `editor/EditorSurface.tsx`
(`variant="standalone"`); `../DiffEditor.tsx` reuses `editor/codeModel.ts`
and `editor/callouts.ts`.

| Task                                         | Where                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Props, layouts, Store placement, `hidden`    | `index.tsx` (`PlaygroundProps` documents each prop)                                                                |
| Fence metastring, file list                  | `editor/codeModel.ts`                                                                                              |
| Editor chrome, SSR markup                    | `editor/EditorSurface.tsx`, `editor/StaticEditor.tsx`, `editor/InteractiveEditor.tsx`                              |
| Monaco: types, completions, go-to-definition | `monaco/` (`preloadManifest.ts` and `../editor-types/` are generated)                                              |
| Running the code, scope globals              | `preview/LivePreview.tsx`, `preview/useCodeManagers.ts`, `preview/transformCode.ts`, `preview/scope.ts`            |
| Preview frame, Store open state and motion   | `preview/PreviewWrapper.tsx`, `preview/StoreToggle.tsx`, `preview/StoreInspector.tsx`                              |
| Store inspector UI                           | `preview/store/` (`StorePanel.tsx` owns its state, `nav.tsx` moves it)                                             |
| Store log, action credit                     | `preview/store/actionLog.ts`, `actionGroups.ts`, `attribution.ts` (names each action's manager)                    |
| Why a fetch happened                         | `preview/store/fetchCause.ts` (reason, playground-free), `callSite.ts` (hook, component, event), `Why.tsx`         |
| Actions listed (`defaultActionsBy`)          | `preview/store/interactions.ts` (sections), `actionRowsOf` (`actionGroups.ts`), `useActionsBy` (`storeView.ts`) |
| Managers the code declares                   | `preview/managers.ts`; [data flow](./managers-data-flow.png) (source `.svg`)                                       |
| EndpointPlayground's live exchange           | `preview/exchange/` (runs the code, its endpoints answered by fixtures); `../HTTP/` draws it                       |
| Multi-page demos, self-playing demos         | `preview/router.tsx`, `preview/autorun/`                                                                           |
| Demo markup's look                           | `DesignSystem/design-system.css`, tokens and skeletons in `base.css` ([Design system](#design-system))             |
| Mobile and crawler gates                     | `userAgent.ts`                                                                                                     |
| Docusaurus stubs for tests                   | `testing/` (mapped in the root `jest.config.js`)                                                                   |

`resources/` is referenced by nothing.

## Server HTML and hydration

The HTML holds what the first paint shows and what crawlers should index,
nothing else: DOM size counts against the page.

| Part                                                  | In the server HTML                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open file, shown                                      | Prism-highlighted (`StaticEditor`, also the `BrowserOnly` fallback)                                                                                                    |
| Code not yet shown (`hidden` tab, a `demo`'s code)    | Plain `<pre>` text; highlighted once it shows                                                                                                                          |
| Collapsed file                                        | Nothing, unless the element has `ssr` (a prop, not a metastring): then plain text                                                                                      |
| Preview                                               | `PreviewLoading`: frame, `PendingSheet`, Store toggle. Same for bots and while the chunk loads                                                                         |
| Preview and row Store folder of a `hidden` playground | Nothing; they mount when it shows                                                                                                                                      |
| Store tree                                            | Never: it loads with the live preview                                                                                                                                  |
| Folded fixtures                                       | The toggle only. Rows render once pointer, focus or a click reaches the playground (`WhenNear`, `index.tsx`: survives the preview's remounts, re-renders nothing else) |

Gotchas:

- Never branch on `navigator` or the user agent during render outside
  `BrowserOnly`: both gates are false on the server, so the markup
  mismatches. `isBot` is read only in the `lazy()` factory (and by
  StackBlitz after intersection); `isMobileOrBot()` only inside
  `BrowserOnly` or in `monaco/setup.ts`.
- Anything the server and browser compute differently mismatches: fixture
  function sources wait for `useIsBrowser` (the bundles stringify them
  differently), and a fixture holding `Date.now()` is safe only folded.
- Loading goes straight to loaded: first paint, chunk load and the app
  waiting on data all draw `preview/PendingSheet.tsx` (an open stacked
  Store too). `PreviewHeaderControls` and the router's start controls
  (`preview/routerSlot.tsx`) make the loading and live headers the same.
- Keep each box the loading frame draws equal to what the live preview
  measures, or the preview jumps at hydration: `--pg-pending-sheet` in
  `row` (`usePreviewGap`); the `--pg-app-*` and `--pg-store-height`
  defaults in stacked (`useAppBox`).
- Monaco mounts under the Prism code (`InteractiveEditor`'s cover), which
  lifts once `monaco/whenPainted.ts` sees it laid out and highlighted to
  its last line. Never give Monaco's container zero width while it mounts:
  it lays out one letter per line.

`hidden` (unselected protocol tabs): every tab stays mounted, so all
sources are in the HTML. The editor latches interactive on first show, so
undo and go-to-definition survive tab switches; the live preview unmounts
while hidden, so its store resets. The homepage passes `hidden`; in MDX,
`PlaygroundTabs` sets it through `PlaygroundHiddenContext`
(`hiddenContext.ts`) for every playground under an unselected tab, nested
groups included. An explicit prop wins. `TypeScriptEditor` in one of those
tabs latches the same way (plain text until first shown).
In `row` (not stacked), the result never shrinks below its tallest
(`useHeightRatchet`), shared by the playgrounds under one
`data-playground-group` (the homepage's protocol switch, `PlaygroundTabs`),
so a switched-in tab's loading page doesn't shorten it.

Mobile and bots get an editable react-live editor instead of Monaco and
download none of it. Mobile runs the preview; bots keep `PreviewLoading`
and never load StackBlitz. `DiffEditor` falls back to two `CodeBlock`s with
callout markers as comments, its caption and legend outside the editor.

## JS delivery

- `preview/` is the lazy `PreviewWithScope` chunk. From outside it, import
  only with `import()`, `import type`, or from a file in `EAGER_PREVIEW`
  (`eslint.config.mjs`); those may not statically import the rest of
  `preview/`. ESLint can't see MDX or a `splitChunks` change, so
  `website/scripts/check-lazy-chunks.mjs` (the `website` job) fails when the
  Store UI ships outside that chunk.
- `website/chunks-plugin.js` shares modules used by 2+ pages; without it
  Docusaurus copies the eager Playground modules into every docs page chunk.
- `monaco/setup.ts` runs once as the editor chunk evaluates and does
  nothing for mobile or bots. `monaco/preloadManifest.ts` is generated from
  the installed `monaco-editor` (gitignored).
- Type libs: one chunk per third-party `.d.ts`, one `dataClientDTS` chunk
  holding exactly `DATA_CLIENT_LIBS`. A failed fetch degrades to an empty
  lib.
- `editor-types/` comes from `yarn copy:websitetypes`; never hand-edit it
  (the `regenerate` workflow fails when it is stale).

## Layouts

`index.tsx` picks `demo`, else `row`, else stacked. Choose by where the
Store goes:

- `row`: preview beside the code. Its Store covers the code, so keep it
  closed by default (no `defaultOpen="y"`).
- Stacked: preview under the code, Store beside the app. Use it to show
  the Store with the code in view, or to give the app the full width.

One open file shows as tabs over a code card (any layout); several open
files (stacked only) show as one card each. Fixtures fold behind the
preview header's toggle in every layout.

- Fence metastring: `title`, `path`, `collapsed`, `column`, `route`,
  `start`, `layout`, `{1-3}` (pre-selected lines) and the `language-*`
  class. Element props override it; `defaultTab` overrides `collapsed`.
- Stacked: the `row`'s paper turned vertical (`.row.stacked`). The
  header's Actions and Store toggles open the drawer beside the app; hover
  opens a quick look in its place (`LookSlot`). Below 720px container width
  it is the narrow `row` (`useNarrow`). Open files are `FileCard`s
  (`editor/EditorSurface.tsx`), each name a caption that folds its card;
  two to a line from 900px container width, a card alone takes the line.
- `row`: files are tabs over the code card; `column` files (e.g.
  EndpointPlayground's Usage) sit on a darker layer tucked under it,
  labeled, never collapsible. The preview is a folder beside it (under it
  below 720px container width) with the Store on a layer behind
  (`.storeHost` > `.storeDrawer`, `DrawerTabs` as handles: Actions over
  Store). The shown handle is pulled fully out as its sheet's paper; hover
  pulls one partway. Open, the drawer covers the code, which goes `inert`.
  A tab's quick look floats beside the handles, or under them when narrow.
  A demo shows the same two tabs in the strip beside the result
  (`StoreToggle`), or in the preview's header (`StoreHeaderToggle`) below
  560px.
- `demo`: preview first, full width; the header's Code toggle swaps in the
  code (`data-code`). Never code and result together, nor code and Store.
  The result stays mounted so app state survives; both share
  `--pg-demo-min` so toggling doesn't move the page. The Code toggle ends an
  `autoRun`.
- A `row` with no folder (`../TypeScriptEditor.tsx`) is the tabs and the
  code card alone; `row={false}` is a stacked one's code (several open
  files are cards). A lone file is a tab only if it has a title; untitled,
  the card has no header row above it.
- `../HTTP/EndpointPlayground.tsx` is a `row` whose folder holds the HTTP
  exchange instead of a preview: the request is the inset header, the
  response the sheet (`../HTTP/styles.module.css`). Live, it runs the code
  (`preview/exchange/`, the preview's lazy chunk) with `RestEndpoint`,
  `resource`, `createResource` and `GQLEndpoint` swapped for endpoints that
  answer each call from `fixtures`, found as MockResolver finds them (exact
  fixture, then the first matching interceptor; none is a 404), and shows the
  last call's exchange. The code runs as an async function, so it may
  `await` at the top level (its editor passes `topLevelAwait`, which drops
  TS1375, raised only in files without imports; other playgrounds keep
  it), and an awaited call's error answer shows as its exchange rather
  than as a throw. A bare `fetch()` throws, so no demo reaches the
  network. The first exchange is rendered on the server (`../HTTP/LiveFolder.tsx`
  runs the code during SSR, outside any Suspense boundary so React writes it
  in place) and read back from the folder's `data-first-exchange` for
  hydration; the browser only runs the code once it is edited.

## Editor

- Collapsed files stay mounted (`display: none`): their Monaco models carry
  cross-file types and edits. Monaco is uncontrolled (`defaultValue`), so
  re-renders never reset the buffer.
- Handlers passed to `InteractiveEditor` must stay referentially stable, or
  every keystroke re-renders every tab.
- A file without imports is a script: its names are global. So each
  playground or diff editor side with a script is its own TypeScript
  program (`monaco/surfaceWorker.js`). Playgrounds of modules only share
  one program, because each program adds a type checker. The
  worker replaces Monaco's private `_languageService`; after a
  `monaco-editor` bump, see [Verify](#verify).
- `monaco/models.ts` creates a surface's models in one pass and relies on
  the TS worker answering in order. No test runs real Monaco: after a
  `monaco-editor` bump, see [Verify](#verify).
- Hovers, suggestions, parameter hints and the context menu render in a
  fixed layer on `<body>` (`monaco/useOverflowWidgets.ts`), above every
  playground layer and the navbar. Monaco measures their room above/below
  in page coordinates, so that hook also patches its hover and suggest
  widgets to measure in the viewport, and its context view service to keep
  the menu in the layer; after a `monaco-editor` bump, see [Verify](#verify).
- A `display: none` editor can't take focus, so `reveal` (go-to-definition,
  Store links) waits until the tab shows, and `openCode` closes a covering
  Store in the same render.

## Running the code

- Files are joined with `\n;\n` (a half-typed statement can't absorb the
  next), stripped of imports and exports, wrapped in one `{}` block (so a
  demo can declare its own `Link` with `const`) and run `noInline`. Two files
  can't declare the same name.
- A design-system export is picked up from `DesignSystem/index.ts` by
  `preview/scope.ts` and `website/framework-docs/checkExamples.mjs`; declare
  its type by hand in `monaco/typeLibs.ts` (`PREVIEW_SCOPE_DECLARATIONS`).
  Any other global goes in all three. `globalScopeLib()` skips `Array` and
  `Object` (`SKIP_NAMES`) so the built-ins keep their types.
- Each playground has its own `DataProvider` with `MockResolver(fixtures)`;
  `memo(Preview)` keeps it from re-rendering on edits, so what reaches it
  must be stable.
- A render error right after an edit retries once with a fresh store (a
  changed `Entity.key` leaves old data unreadable); if it persists, the old
  store comes back and no retry runs until a clean render held for
  `HEALTHY_AFTER_MS`. Compile and evaluation errors never reset. `ErrorPanel`
  names the stage: compile (react-live `SyntaxError`, the code never ran),
  runtime, or manager (the preview runs on without it). Demos rely
  on this instead of their own store-clearing fallbacks; say so in the prose
  beside a demo that needs it.
- `usePlaygroundConsoleDemotion` demotes only React's recreate-tree report.
  Never add matchers for `@data-client/*` or first-party code: fix the
  source.

## Managers

- `getManagers()` in the code sets the store's managers (otherwise
  `getDefaultManagers({ devToolsManager: null })`). Only editing its file,
  or a file declaring a name it uses, remounts the store; other edits keep
  sockets open. Code that fails to run keeps the old managers.
- A kept manager closes over the run that built it, so it reaches the UI
  only through what every run shares: the store, or a design-system module
  such as `toast`.
- Attribution matches library managers by exact class, so a subclass counts
  as the playground's own code.

## Store inspector

- Open state and its tab (`Inspect`: `store` or `actions`) persist per
  `groupId`; `defaultOpen` takes either, or `n`. Closing one Store closes
  every one in the group. Toggling holds the page's scroll position.
- The drawer's tabs (`InspectorContext`) are the only tabs; `StorePanel`
  has none. The shown tab shuts the drawer; the other switches to it.
  Actions always opens at its list: every way in bumps `listed`, which
  `StorePanel` resets on. Links in the panel (`select`) open where they
  point.
- Quick look (`store/QuickLook.tsx`): a mouse resting on a tab not shown
  opens a card beside the tabs with that tab's live view (the store with
  optimistic updates applied, or the newest actions). Touch has none. Its
  state lives outside React (`createPeek`). Escape closes it before the
  drawer or a level takes the key, except from inside the panel while the
  narrow timeline's sheet is open.
- Row: `StoreInspector` portals into the drawer (`FolderPanel`, an
  `<Activity>` hidden once the sweep shuts, so reopening finds it as left).
  Other layouts: a `Reveal` (`../motion/README.md`); the tree renders a
  frame after the drawer starts moving (`useDeferredValue`).
- The Store animates only while the reader or a demo moves it: `useStoreOpen`
  counts moves, `useStoreMotion` turns them into `data-store-moving`, which
  alone gives `--pg-store-*` their durations; the stacked `MotionGroup`
  (`layoutDependency={storeMoves}`, `Preview.tsx`) keys on the same count.
  Hydration, a tab showing the playground, a resize, or another Store in the
  group closing this one must land without animating (`StoreMotion.test.tsx`).
- `Preview.tsx` connects `registry.log` with `log.head` first and `log.tail`
  last; keep that order when adding managers (the head credits the sender,
  the tail sees what reaches the store). `usePreviewReset` owns the
  `history` id: a fresh store starts a new one, a retry-restored store
  continues its own. `DOCS_LOG` shortens the log's defaults because a page
  holds several playgrounds.
- Navigation state lives in `StorePanel`; the moment moves only through
  `stepAt` and `pickAt`, and `unitOf` alone defines what a `scope` spans.
  Keep `GroupRow` memoized and `subjectFilter`'s result stable, or every row
  re-renders. Timeline marks are fractions (`--tl-f`), never measured.
  ← → reach the panel only when the focused element has no use for them
  (`usesArrows`).

## renderCount

The badge is a `<Profiler>` commit count written to the DOM. It needs
`website/profiling-plugin.js` (React's profiling build; production never
calls `onRender`) and `website/profiling-loader.js` (DevTools check pinned
off). It stays hidden while `onRender` never fires, so a broken swap shows
nothing rather than a wrong count.

## Multi-page demos (router)

A fence with `route="/posts/:id"` is a page: its default export, the path's
params as props. When any file has one, `routerTrailer` appends the
`render()`, so no file calls it. A `layout` fence wraps every page and
stays mounted; `start` opens somewhere other than `/`, and a reset starts
over there. Pages move with the scope's `Link` and `useNavigate()`, already
a transition, so they need no `startTransition`.
Vue examples don't run; `checkExamples.mjs` declares `RouterLink` and
`RouterView` for them.

## Design system

`DesignSystem/design-system.css` is scoped to `.playground-preview`; its
tokens (`--ds-*`, reading `--pg-*`) and skeletons (`base.css`) load with the
Playground so the first paint shows the app's loading page. Doc examples
use plain elements and these classes, never inline styles: a look changes in
one place. Space separates things, not lines: no borders or dividers (form
controls keep an edge). Before restyling a class, grep `docs/` and
`website/src/components/Demo/code` for its users. Prefer a class or element
style to a new component.

Styled elements: `h2` (page title), `button` (`primary` fills one;
`aria-busy` shows pending), text inputs, `nav`, `fieldset`, `progress`,
`table`. A `section` whose `h3` holds an `Avatar` (a person's tasks) is a
person's group: the label leads it, the avatar sized for you, and the rows
hang under it on a line.

| Class                                      | Use for                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `appHeader` + `appTitle`                   | the app's top bar and wordmark                                                  |
| `card`                                     | a group (no box: the sheet is the card)                                         |
| `list`, `listItem` (`nogap`, `spaced`)     | rows; checkbox rows highlight and fade when done; `aria-busy` fades stale rows  |
| `meta`                                     | secondary text; last in a `listItem`, it sits at the row's end                  |
| `value`                                    | a row's figure (a price); last in a `listItem`, at the row's end, tabular       |
| `byline`, `author` (`Avatar` takes `size`) | who wrote something                                                             |
| `pill`                                     | a label after a name (an admin), in the accent                                  |
| `assignee` (a `label`)                     | a row's owner: their avatar in a ring; a `select` in it is the picker           |
| `buttonGroup`                              | segmented actions (Fail Soft, Fail Hard)                                        |
| `segmented`                                | a filter's 2-4 choices on a track; `aria-pressed` marks the pick, a pill slides |
| `field` (a `label`)                        | its name over the `input` or `textarea` it holds                                |
| `search` (a `label`)                       | `input type="search"`, `button.clear`; `aria-busy` spins its magnifier          |
| `cancel` (`<CancelButton />`)              | a row's remove button                                                           |
| `skeleton`                                 | a value still loading; `<Loading />`, the default fallback, draws a page        |
| `toaster`, `toast`                         | notifications: render `<Toaster />`, call `toast.success()` or `toast.error()`  |
| `boardColumn`                              | a kanban column                                                                 |
| `upvote` (a button)                        | an upvote with its count; empty, the arrow alone                                |
| `stats` (a `dl`)                           | figures side by side, each large over its label; a lone one fills the row       |
| `stepper` (− `output` +)                   | a quantity's buttons around its count (one button alone: Add); in a row         |
| `table` (`value` cells), `sort` (a button) | rule-free rows (no hover); a `th`'s `button.sort` sorts, `aria-sort` marks it   |

A `search` input needs a `placeholder`: its clear button hides while the
placeholder shows, the one way CSS can tell the field is empty. A text input
in a `listItem` (a new todo) is the row's text until hovered or focused;
give it a `placeholder` and an `aria-label`. `aria-busy` on a text input outside a row traces
its border while its entry saves, like a busy button.

A list whose rows change place (a sort, a filter, a row moving to another
group) wraps them in `<Reorder layoutDependency={list}>` and gives each row
`ref={useReorderItem(row.pk())}`: rows glide to their new place, whatever the
layout. `{ onDrop }` on a row and `ref={useDropGroup(value)}` on a group let the reader
drag rows into groups as well (the joins demo: a todo into its new owner's
group, beside the `assignee` picker). These are the site's own motion
(`../motion`).

## Auto-run

`autoRun` (a `Step[]`, `preview/autorun/script.ts`) plays the first time 60%
of the preview (or viewport) is in view, never under reduced motion. The
"Live Preview" label becomes its replay control (`DemoLabel`). `player.ts`
owns timing, `stage.ts` the DOM, `useAutoRun.ts` connects them.

Writing a script:

- Declare it as a module-level `export const` (like `raceDemo` in
  `docs/rest/shared/_optimisticTransform.mdx`): once-per-page is keyed by
  array identity, so an inline array replays on every framework switch.
- Target Store UI with `in: 'store'`. Match `aria-label`s and `data-*`
  attributes, not visible text that copy edits change.
- The Store opens in the reader's saved view and tab. A script that needs
  one names it (`{ store: 'open', view: 'table' }`,
  `{ store: 'open', tab: 'actions' }`); neither is saved.
- A missing target ends the run after `FIND_TIMEOUT`, and only the console
  says so (`Playground demo:`). Step counts follow the fixtures, so a
  fixture change means recounting.

Keep when changing the player: the reader's own input (`isTrusted`) ends
the run for good, except scrolling, hovering, a touch that starts a scroll
and `data-autorun-control`. It pauses while neither the preview nor the
playground is mostly in view, or in a background tab, never calls
`focus()`, and reaches React only in `DemoLabel`, so a run never
re-renders the playground.

## Verify

- Unit tests:
  `yarn test --selectProjects ReactDOM --testPathPatterns website/src/components/Playground`.
  CI persists only `Playground/`, `motion/` and `utils/` for these, without
  the website's dependencies; `react-live` is a root devDependency so
  `PreviewError.test.tsx` can pin the behavior it relies on.
- Lazy imports: `yarn lint website/src/components/Playground`.
- Chunks, as the `website` job runs it:
  `yarn workspace rdc-website build && node website/scripts/check-lazy-chunks.mjs`.
- Doc examples against the scope: `yarn workspace rdc-website check:doc-examples`.
- Server HTML: after changing what renders on the server, build and check
  the browser console for React #418/#423 (hydration) on a page with each
  layout and on the homepage.
- Hard refresh: after changing what loads or hydrates, reload a stacked
  and a `row` page with the cache off and CPU throttled 4×; no frame
  between the server HTML and the live preview may move anything.
- In a browser: after a `monaco-editor` bump, open a multi-file playground
  after page load (a second homepage tab) whose importing file comes before
  the file it imports, and check for no TS2307 marker. Play any changed
  auto-run script at desktop and phone widths (on a phone the Store opens
  above the preview). After a `monaco-editor` bump, also hover a line near
  the viewport's top on a scrolled page and check the hover opens below it,
  and right-click the code in light and dark themes and check the menu has a
  background and draws over the file tabs. On /rest/api/RestEndpoint, check
  for no "Cannot redeclare" marker. In dev, the console warns
  `useOverflowWidgets: Monaco has no …` when a patched method or the context
  view service is gone (a missing hover or suggest widget stays silent).
