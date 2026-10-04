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
| Different front matter value           | `vue_<key>:` overrides `<key>:`               |
| Different sidebar category value       | `"vue_<key>"` overrides `"<key>"`             |
| Different heading text                 | `## :react[...]:vue[...] {#stable-id}`        |
| Page has no Vue equivalent             | `frameworks: [react]` in front matter         |
| Vue-only page, or nothing is shareable | `foo.vue.md` next to (or instead of) `foo.md` |

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

## Agent skill references

`skillReferences.mjs` (`yarn build:skills`) renders the docs each skill lists in
`.agents/skills/<skill>/references.json` into plain markdown with `docsToMarkdown.mjs`: framework
content resolved the same way (`remarkFramework.js`, front matter and `.vue.md` helpers from
`index.js`), Docusaurus' own MDX preprocessing, partials inlined, and playgrounds, tabs and embeds
reduced to their code. The
first framework in `frameworks` writes `<name>.md`; later ones write `<name>.<framework>.md` only when
the page differs. Output is committed because skills install straight from the repo; the `skills`
workflow runs `yarn build:skills --check`.

Partials can use `props` in `{...}` expressions; the generator evaluates them with the props passed
where the partial is used. JSX inside an expression is only supported for `<CodeBlock>`; anything
else fails the build so it can't silently drop content.
