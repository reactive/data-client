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

Framework-agnostic code (managers, middleware, types) imports from `@data-client/react` and adds
`framework-imports` to the fence; Vue pages show `@data-client/vue` instead. Never import
`@data-client/core` in examples: apps only install `@data-client/react` or `@data-client/vue`.

Nest inside an admonition by giving the outer one more colons (`::::tip` ... `::::`).

Sidebars come from `website/sidebars.json` for both frameworks; entries for docs that don't exist
in a framework are dropped automatically, so Vue-only docs can be listed there too. Items take the
same `vue_<key>` overrides as front matter, e.g. `"vue_label": "Composables"` on the `Hooks` category
(docs are relabeled with `vue_sidebar_label:` in their front matter).

Give per-framework headings an explicit id so links to them work in both frameworks. A heading with
no text left for a framework (e.g. only `:react[...]`) is dropped from that framework's page.

## How it works

- `remarkFramework.js` keeps the matching `:::react`/`:::vue` content and drops the rest. Each docs
  instance runs it with its own framework.
- Docusaurus can't point two docs instances at one folder, so `index.js` mirrors `docs/core` into
  `docs/.core-vue` (gitignored; a sibling so relative imports into `docs/rest` keep working), applying `.vue.md` overrides, `vue_` front matter and
  `frameworks:` filtering. It runs on config load and re-syncs on change during `yarn start`.
- `FrameworkSelector` (in the breadcrumbs) switches to the same page in the other docs instance,
  and disables a framework when the page doesn't exist there.
