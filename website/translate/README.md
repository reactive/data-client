# Docs translations

English in `docs/` is the only source. The repo decides what needs translating and checks what comes back; who translates (a person, a scheduled agent, any model) is up to them. Agents follow the `translate-docs` skill (`.agents/skills/translate-docs`).

## Where things live

| Path                              | What                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `locales.js`                      | Locales, their target language and which pages they translate                           |
| `glossary/<locale>.md`            | Terms and register for translators                                                      |
| `website/i18n/<locale>/docs/...`  | Translations, at the source's path: `docs/core/x.md` → `website/i18n/es/docs/core/x.md` |
| `website/i18n/<locale>/**/*.json` | Docusaurus UI strings (navbar, footer, sidebar labels)                                  |
| `lock/<locale>.json`              | The English each translation was checked against (written by `finalize`)                |

A translation keeps its English page's imports and links. At config load, `localeDocs.js` generates the folders Docusaurus renders for a locale (gitignored): every English file, with its translation in its place where there is one. So a page without a translation renders in English (marked `lang="en"` and `noindex`, so search engines keep the English URL), and links and imports between translated and English pages resolve as written. The Vue docs mirror the locale's `docs/core` like `/vue` mirrors `docs/core` (`framework-docs/index.js`). The blog isn't translated; in other locales its pages are marked English the same way (`remarkEnglishPage.js`).

## Translating

```bash
# remove translations no longer wanted, scaffold new UI strings, list the work
node website/translate/translate.mjs prepare        # --json for tools, --locale es for one

# ...translate what it lists...

# check changed translations, pin heading anchors, record them in the lock
node website/translate/translate.mjs finalize       # or name the files to accept

# preview
cd website && yarn start --locale es
```

- **New and stale pages**: `prepare` lists a page when the lock has no entry for it or its English changed since. For a stale page it gives `git diff <old> <new>`, the English change, so the translation can be updated in place and its reviewed wording kept.
- **Structure is checked** (`mdx.mjs`): a translation must parse as MDX and keep its English page's code, inline code, imports, JSX tags and attributes (except `label`/`title`/`alt`/`description`), expressions, directives, link targets, heading levels, block order and front matter (except `title`/`sidebar_label`/`description`). A paragraph, heading or table cell of four or more words left identical to English counts as skipped. `finalize` reports what differs and does not record the page.
- **Anchors**: `finalize` gives every heading the `{#id}` of its English heading, so `#links` keep working.
- **Partials**: a locale's pages bring along the `_partials` they import from their own docs folder.
- **UI strings**: Docusaurus' own theme strings come translated; `prepare` lists the site's strings still in English, and `finalize` records translated ones (placeholders like `{count}` must survive).
- **CI**: `check` (in `site-preview.yml`) fails when a translation isn't finalized, is in the lock but missing, or no longer has the structure of the English it records. A translation behind English is fine; it is listed again by the next `prepare`.

## Adding a locale or pages

- Pages: edit `pages` in `locales.js` (unset translates every page), then translate.
- Locale: add it to `locales.js` (Docusaurus picks it up from there) and add `glossary/<locale>.md`, then translate.
