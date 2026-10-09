---
name: translate-docs
description: Translate the docs site into another language (website/i18n), or update translations after the English docs changed; the repo lists the work and validates it, any model can translate
disable-model-invocation: true
metadata:
  internal: true
---

# Translate the docs

English in `docs/` is the only source. `website/translate/translate.mjs` lists what to translate and checks what you wrote; you do the translating. How the pieces fit: `website/translate/README.md`.

## Procedure

1. `node website/translate/translate.mjs prepare --json` (add `--locale es` for one locale). For each locale it prints:
   - `language`: the language to write, and `glossary`: the terms file to follow.
   - `pages`: each `source` page to translate into its `translation` file. `new` pages need a full translation. `update` pages already have one: when a `diff` command is given, run it to see what changed in English and change only the matching parts of the translation, keeping every other line as it is (reviewed wording survives this way). Without a `diff`, compare the translation against the English yourself.
   - `removed`: translations it deleted because their page is no longer translated; commit the deletion.
   - `ui`: UI strings (navbar, footer, sidebar labels) still in English. Each `id` is `<json file>#<key>`; translate the `message` of that key in the file. `previous` is its translation of older English, to update.
2. Translate, following the rules below. Write each page to its `translation` path; create folders as needed.
3. Before committing, `node website/translate/translate.mjs finalize`. It checks every changed translation against its English, adds heading anchors, and records the English it translates in `website/translate/lock/<locale>.json`. Fix each `✗` problem it prints and run it again until it passes. A UI string that should read the same as English (a product name) is accepted with `--same <id>`.
4. Commit the translations, the UI JSON files and the lock together.

Never edit `website/translate/lock/*.json` or the generated `website/i18n/<locale>/docusaurus-plugin-content-docs*/current/` folders yourself.

## Translation rules

The docs are for Reactive Data Client (`@data-client`), a TypeScript library for fetching, caching and mutating async data in React and Vue apps.

Write natural, precise technical prose for developers, as a native-speaking engineer would. Keep the meaning, tone and level of detail; never add, drop or summarize content.

Pages are MDX (Markdown with JSX) for Docusaurus. Translate only human-readable prose: paragraphs, headings, list items, table cells, admonition titles (the text in `:::tip[...]`), link text, image alt text, text between JSX tags, `label`/`title`/`alt`/`description` attribute strings, and the `title`, `sidebar_label` and `description` front matter values (and their `react_`/`vue_` variants).

Keep everything else byte for byte (`finalize` rejects changes to it):

- Code blocks, inline code (`like this`), import and export lines, JSX tags and their other attributes, `{expressions}` and HTML.
- Directive lines: `:::react`, `:::vue`, `:::tip` and other `:::` lines, and inline `:react[...]`/`:vue[...]` (translate only the text in their brackets).
- Link and image URLs, front matter keys and every other front matter value, and heading ids like `{#some-id}`.
- Markdown structure: the same headings at the same levels, paragraphs, lists, tables and blank lines.

Product, API and package names stay in English. The glossary of each language has the rest.
