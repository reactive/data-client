# Playground

Live, editable code examples for the docs, blog and homepage. Read this before
changing anything here: most of the complexity exists to keep pages fast,
indexable and hydration-safe, and those behaviors are easy to drop silently.

## Entry points

| Component                                                                                   | Used by                        | What it renders                         |
| ------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------- |
| `HooksPlayground` (`../HooksPlayground.tsx`) → `Playground` (`index.tsx`)                   | MDX docs/blog, homepage `Demo` | Editor + live preview + Store inspector |
| `TypeScriptEditor` (`../TypeScriptEditor.tsx`)                                              | MDX                            | Editor only (`variant="standalone"`)    |
| `EndpointPlayground` (`../HTTP/EndpointPlayground.tsx`)                                     | MDX                            | Editor + static HTTP request/response   |
| `DiffEditor` (`../DiffEditor.tsx` → `../DiffEditorChooser.tsx` → `../DiffEditorMonaco.tsx`) | MDX                            | Read-only Monaco diff of two fences     |
| `Demo/CodeEditor` (`../Demo/CodeEditor.tsx`)                                                | Homepage                       | One `HooksPlayground` per protocol tab  |

## Layout

```
index.tsx           Playground: code model, editor/preview ordering, hidden handling
userAgent.ts        isBot / isMobileOrBot gates
PlaygroundEditor.tsx  editor entry used by EditorSurface (aliases editor/InteractiveEditor)
PlaygroundLiveEditor.tsx  editable react-live editor (mobile/bot fallback)
resources/          sample resources (currently unreferenced; kept for future demos)
Boundary.tsx        BrowserOnly + Suspense with one fallback for SSR and loading
Header.tsx, TabList.tsx, styles.module.css   shared chrome (also used by HTTP/, Demo/)
editor/             code model + editor UI
  codeModel.ts        parse MDX fences/strings into documents; edits
  EditorShell.tsx     react-live LiveProvider supplying the Prism theme
  EditorSurface.tsx   headers, file tabs, collapse state, per-file TextEditTab
  StaticEditor.tsx    SSR/crawler/loading markup (Prism, not editable)
  InteractiveEditor.tsx  client-only: Monaco, or editable react-live on mobile/bots
monaco/             everything Monaco-specific
  setup.ts            side-effect init: loads Monaco, compiler options, theme, types; useMonacoReady
  monaco.ts           loadMonaco(): Monaco's ESM build in three lazy stages
  workers.ts          MonacoEnvironment.getWorker: one webpack worker chunk per language service
  typeLibs.ts         raw .d.ts chunks from editor-types/ → addExtraLib
  navigation.ts       cross-tab go-to-definition + import completions
  modelPath.ts        `/<id>/<file>` model URI scheme
  theme.ts, options.ts, language.ts, useAutoHeight.ts, highlightSelections.ts
preview/            live execution (loaded lazily, never on the server)
  LivePreview.tsx     react-live LiveProvider with scope + transformCode
  Preview.tsx         DataProvider + MockResolver(fixtures) + Store inspector
  ...
editor-types/       .d.ts bundles fed to Monaco (raw-loader)
DesignSystem/       components injected into preview scope
```

## Invariants

### SSR / SSG and crawlers

- Open files' source is in the static HTML: `TextEditTab` renders
  `StaticEditor` on the server and during hydration (BrowserOnly fallback).
  Collapsed/unselected files render nothing until opened.
- The preview renders `previewLoading` (empty frame + Store toggle) on the
  server, while loading, for bots, and while `hidden`.
- Fixtures render server-side as JSON `CodeBlock`s; function responses are
  BrowserOnly (a stringified function differs between server and client
  bundles).
- Never branch on `navigator`/user agent during render outside `BrowserOnly`
  (hydration mismatch). `isBot` is module-level and only read in the
  `lazy()` factory (and in StackBlitz after intersection); `isMobileOrBot()`
  is only called inside BrowserOnly or in `monaco/setup.ts`.

### Incremental JS delivery

- Monaco is bundled from `monaco-editor`'s ESM build; nothing loads from a
  CDN. `monaco/setup.ts` runs once when the editor chunk evaluates and starts
  `loadMonaco()` and the type-lib chunk downloads in parallel. `loadMonaco()`
  imports Monaco's own entry points in three lazy chunks (`monaco-editor/editor`,
  `features/register.all`, then `monaco-editor`), yielding to the main thread
  between them: evaluated at once they are one ~250 ms long task. It resolves
  to the full `monaco-editor` namespace, which `setup.ts` hands to
  `@monaco-editor/react` via `loader.config({ monaco })`.
- Editors render their loading view until `useMonacoReady()`: an editor that
  mounted before `loader.config` would make `@monaco-editor/react` fetch its
  own Monaco from jsDelivr.
- Monaco's CSS stays in its chunk (`website/monaco-plugin.js` swaps
  Docusaurus' single extracted stylesheet for style-loader there).
- Language services and their workers (`monaco/workers.ts`) are separate
  chunks fetched only when a model of that language exists; the TS worker is
  created once the core stage loads rather than when the first editor mounts.
- Type libs: one webpack chunk per third-party `.d.ts` (`reactDTS`, …) and a
  single `dataClientDTS` chunk holding exactly the `DATA_CLIENT_LIBS` entries
  (check-only editor types such as `vue/test` stay out). Failed fetches
  degrade to empty libs.
- Preview code is a lazy chunk (`PreviewWithScope`, prefetched) and
  `PreviewBlock` a nested lazy chunk (preloaded with its parent).
- Mobile and bots download none of Monaco or the type libs.

### Mobile and bots

- Mobile: editable react-live editor instead of Monaco; live preview still runs.
- Bots: same editor fallback; preview stays `previewLoading` (never loads
  `LivePreview`); StackBlitz embeds never load.
- `DiffEditor` shows a two-`CodeBlock` grid instead of Monaco, with callout
  markers appended as trailing comments; caption and callout legend are
  outside the editor, so they render for everyone.

### Hidden playgrounds (homepage Demo protocol tabs)

- All protocols stay mounted so every protocol's source is in the HTML.
- `hidden` keeps `StaticEditor` (no Monaco) until first shown, then latches
  interactive so undo history and go-to-definition survive tab switches.
- The live preview unmounts while hidden (its store resets).

### Editor

- Fence metastring: `title="…"`, `path="…"` (quotes optional), `collapsed`, `column`, `{1-3}`
  highlight ranges (pre-selected in Monaco); `language-*` class. Element props
  override metastring values (Demo passes them directly). `defaultTab`
  overrides `collapsed`.
- `row` layout: non-`column` files are tabs (focus switches tab); `column`
  files stack with collapsible headers. Stacked layout: every titled file gets a header,
  collapsible when there are several files or fixtures.
- Collapsed/unselected files stay mounted (`display: none`), never unmounted:
  their Monaco models must exist for cross-file types, go-to-definition and
  to keep edits. Monaco is uncontrolled (`defaultValue`), so re-renders never
  reset the buffer.
- Fixtures are listed above the editor in stacked layout only.
- Go-to-definition across files: focusing the target editor reveals its tab.
  Relies on the `/<numeric id>/<path>` model URIs (`monaco/modelPath.ts`).
- Relative import completions list only the other files of the same
  playground (same model id).
- Handlers passed to `InteractiveEditor` are referentially stable so unedited
  tabs skip re-rendering on keystrokes.
- Height follows Monaco content size and re-measures when a tab is shown.

### Preview

- All documents are concatenated (deferred with `useDeferredValue`),
  stripped of imports/exports by `transformCode`, and run `noInline`
  (`render(<App />)`) with `preview/scope.ts` as globals. Keep
  `monaco/typeLibs.ts` declarations in sync with the scope: `globalScopeLib()`
  aliases library exports into `declare global`, and `Array`/`Object` keep
  their built-in types (they're type-only exports).
- Each playground gets its own `DataProvider` store (`MockResolver` serves
  `fixtures`); `memo(Preview)` keeps it from re-rendering on code edits.
- Store inspector open state persists per `groupId` via tab storage and
  avoids scroll jumps; in `row` layout it replaces the result while open.
- `renderCount` wraps the live result in a `<Profiler>` and shows its commit
  count in the preview header (written to the DOM, so counting adds no commits).
  `website/profiling-plugin.js` replaces `react-dom/client` with React's
  profiling build because production builds never call `onRender`; the badge
  stays hidden if that ever stops working. `website/profiling-loader.js` pins
  the build's DevTools check off, so only `<Profiler>` subtrees are ever timed
  (otherwise DevTools users would profile every page).
- Third-party console noise is demoted only while previews are mounted
  (`usePlaygroundConsoleDemotion`); never add first-party matchers.

## Tests

`yarn test --selectProjects ReactDOM --testPathPatterns website/src/components/Playground`
(CI persists only this directory of the website for these tests.)
