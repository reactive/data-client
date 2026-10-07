# Framework docs

`docs/core` is the single source for both the React docs (`/docs`) and the Vue docs (`/vue`).

## Authoring

````mdx
---
title: useSuspense() - Simplified data fetching for React
vue_title: useSuspense() - Simplified data fetching for Vue
---

Shared prose renders for both frameworks.

:::react

Only on React pages. Can contain anything, including `<HooksPlayground>`.

:::

:::vue

Only on Vue pages.

:::

Errors are caught by :react[[Error Boundaries](./AsyncBoundary.md)]:vue[`onErrorCaptured()`].

<FrameworkPlayground fixtures={detailFixtures} row>

```ts title="Resource" collapsed
// shared by both frameworks
```

:::react

```tsx title="ProfileDetail"

```

:::

:::vue

```html title="ProfileDetail.vue"

```

:::

</FrameworkPlayground>
````

| Need                                   | Use                                           |
| -------------------------------------- | --------------------------------------------- |
| Different block of content             | `:::react` / `:::vue`                         |
| Different word or link inline          | `:react[...]` / `:vue[...]`                   |
| Same code, framework's package         | ` ```ts framework-imports ` (see below)       |
| Different front matter value           | `vue_<key>:` overrides `<key>:`               |
| Different sidebar category value       | `"vue_<key>"` overrides `"<key>"`             |
| Different heading text                 | `## :react[...]:vue[...] {#stable-id}`        |
| Page has no Vue equivalent             | `frameworks: [react]` in front matter         |
| Vue-only page, or nothing is shareable | `foo.vue.md` next to (or instead of) `foo.md` |
| Same concept under another doc id      | `framework_equivalent: <doc id>` (see below)  |

Framework-agnostic code (managers, middleware, types) imports from `@data-client/react` and adds
`framework-imports` to the fence; Vue pages show `@data-client/vue` instead. Never import
`@data-client/core` in examples: apps only install `@data-client/react` or `@data-client/vue`.

Nest inside an admonition by giving the outer one more colons (`::::tip` ... `::::`).

Sidebars come from `website/sidebars.json` for both frameworks; entries for docs that don't exist
in a framework are dropped automatically, so Vue-only docs can be listed there too. Items take the
same `vue_<key>` overrides as front matter, e.g. `"vue_label": "Composables"` on the `Hooks` category
(docs are relabeled with `vue_sidebar_label:` in their front matter).

When a framework-only page covers what the other framework documents under a different id (Vue's
`DataClientPlugin` is React's `DataProvider`), name that doc id in `framework_equivalent:` on either
page, so the framework selector switches between them. Declaring it on one page is enough; it works
in both directions, unless the other page names its own `framework_equivalent`. The build fails if the id doesn't exist in the other framework.

Give per-framework headings an explicit id so links to them work in both frameworks. A heading with
no text left for a framework (e.g. only `:react[...]`) is dropped from that framework's page.

### Code examples

Code fences are copied verbatim into skill references and into readers' apps, so
`yarn check:doc-examples` (`checkExamples.mjs`, run by the `regenerate` check) type-checks each
framework's rendering of the docs against the playground's editor types (`@data-client/react`,
`@data-client/vue`, `@data-client/rest`, ...): React with TypeScript, Vue with `vue-tsc`. Pass
`react` or `vue` to check one. It checks each playground as one app (for Vue, each that has a `.vue`
file; files import each other by title: `./Resource` is the block titled `Resource`), and every
other React ` ```tsx ` block, Vue ` ```html ` single file component (titled or not) or ts block
importing the framework's package on its own, where relative imports resolve to the page's titled
blocks or to stubs typed `any`.

- Import everything a block uses: `@data-client/rest` schemas and `@data-client/react` hooks the
  React playground would provide as globals, `Temporal` from `temporal-polyfill`, and the app's own
  modules (`import { ArticleResource } from './resources/Article'`).
- The playground's design system (`website/src/components/Playground/DesignSystem`: `Loading`,
  `Avatar`, `TextInput`, ...) stands for the app's own components and needs no import, like
  `render()`, which mounts a React playground's app, and Vue's `RouterLink` and `RouterView`.
  `NumberFlow` is a real library: import it from `@number-flow/react` or `@number-flow/vue`.
- Overview pages (`README.md`, like `docs/core/README.md`) may leave imports out of snippets for
  readability, so only their playgrounds are checked.
- Add `nocheck` to a fence's meta (` ```tsx title="Foo" nocheck `) only for a deliberately partial
  fragment; it's dropped from the rendered page and skill references.

React:

- The React playground strips imports and provides only `React` and `use` from `react`, so
  playground blocks use `import React from 'react'` and `React.useState()`. Other blocks import
  hooks by name.
- Format `Temporal` values with `toLocaleString()`, not the playground's `DateTimeFormat`.

Vue:

- Import child components (`import ArticleForm from './ArticleForm.vue'`). Vue templates only see
  what `<script setup>` imports.
- Use HTML elements Vue knows: `<center>` and `<strike>` resolve as (missing) components.
- Template expressions only see Vue's allowed globals, not `FormData` or `window`; move such code
  into `<script setup>`.

## How it works

- `remarkFramework.js` keeps the matching `:::react`/`:::vue` content and drops the rest. Each docs
  instance runs it with its own framework. It then drops imports nothing references anymore, so a
  partial or component used only inside `:::react` isn't bundled into the Vue page.
- Docusaurus can't point two docs instances at one folder, so `index.js` mirrors `docs/core` into
  `docs/.core-vue` (gitignored; a sibling so relative imports into `docs/rest` keep working), applying `.vue.md` overrides, `vue_` front matter and
  `frameworks:` filtering. It runs on config load and re-syncs on change during `yarn start`.
- `docsInstances.js` lists every docs instance (id, source folder, route, `llms.txt` path).
  `docusaurus.config.ts`, `docsToMarkdown.mjs`, `llms-plugin.js` and `remarkFramework.js`
  (`FRAMEWORKS`) read routes and frameworks from it.
- `index.js` `docsFor()` lists each framework's docs with their routes (honoring `slug`) and
  `framework_equivalent`; `remarkFramework.js` and `docsToMarkdown.mjs` link with those routes.
- `FrameworkSelector` (in the breadcrumbs) switches to the same page in the other docs instance, or
  its `framework_equivalent` (`customFields.frameworkEquivalents`), and disables a framework when
  neither exists there.

## Agent skill references

`skillReferences.mjs` (`yarn build:skills`) renders the docs each skill lists in
`.agents/skills/<skill>/references.json` into plain markdown with `docsToMarkdown.mjs`: framework
content resolved the same way (`remarkFramework.js`, front matter and `.vue.md` helpers from
`index.js`), Docusaurus' own MDX preprocessing, partials inlined, and playgrounds, tabs and embeds
reduced to their code. The
first framework in `frameworks` writes `<name>.md`; later ones write `<name>.<framework>.md` only when
the page differs. Output is committed because skills install straight from the repo; the `regenerate`
check reruns `yarn build:skills` and fails on drift; the generator also fails when a `SKILL.md` links to a
`references/` file that no longer exists, a reference is a symlink or a hand-written copy of a doc (named after a
`docs/` page), or a skill has `.vue.md` variants its
`SKILL.md` never mentions. See `.cursor/rules/skills-sync.mdc` for what to update
when docs are added, renamed or deleted.

A `skills` list in `references.json` bundles other skills, so one skill works without the others
installed (`data-client-setup` carries the REST, GraphQL and endpoint setup skills). Each bundled
skill's `SKILL.md` body becomes `references/<skill>.md`, with its relative links pointing into
`references/<skill>/`, which holds copies of its references and scripts.

Prose only for readers of the site, such as how to install or run a skill, goes in `<SiteOnly>`
(`@site/src/components/SiteOnly`, around blocks or inline): skill references drop it, so a skill
never tells an agent to install the skill it's running (`llms.txt` keeps it). Content only agents need goes in `docs/core/_agents/`.

Partials can use `props` in `{...}` expressions; the generator evaluates them with the props passed
where the partial is used. JSX inside an expression is only supported for `<CodeBlock>`; anything
else fails the build so it can't silently drop content.
A `<CodeBlock>` inside a playground passes its fence meta as `metastring`
(`metastring='title="api/Feed" collapsed'`), which both the playground and the generator read; see
`docs/rest/shared/_PolymorphicFeedDemo.mdx`.
