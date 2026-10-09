# Docs translations

English in `docs/` is the only source. Translations live where Docusaurus reads them, `website/i18n/<locale>/`, and are written by `translate.mjs`, never by hand-copying English. A page without a translation renders in English, so a locale can cover part of the docs.

## Running it

```bash
# what would be translated (no API calls)
node website/translate/translate.mjs --dry-run

# translate new and changed pages, then the UI strings (needs ANTHROPIC_API_KEY)
node website/translate/translate.mjs

# preview a locale
cd website && yarn start --locale es
```

| Option            | Does                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `--locale es`     | Only this locale (repeatable); all of `locales.js` by default                                         |
| `--model <id>`    | Translation model (also `TRANSLATE_MODEL`); default `claude-sonnet-5-5`                               |
| `--force`         | Retranslate pages that are up to date (e.g. after a glossary change)                                  |
| `--skip-ui`       | Skip the navbar/footer/sidebar strings (they run `docusaurus write-translations`)                     |
| `<paths>`         | Only these source pages, e.g. `docs/core/getting-started/installation.md`                             |
| `--out-dir <dir>` | Write the given pages under `<dir>`, without touching translations or the lock (for comparing models) |

`translate.yml` runs it on every push to master that changes the docs and opens a pull request with the result.

## How it stays in sync

- **Lock** (`lock/<locale>.json`): for each translated page, the git blob of the English it was translated from. A page whose English blob changed is stale; one with no entry is new. UI strings record the English message they were translated from.
- **Updates, not rewrites**: a stale page is sent with its previous English, its new English and its current translation, and the model changes only what the English change requires, so reviewed wording and hand fixes survive. If git no longer has the previous English, the page is translated from scratch.
- **Code never reaches the model**: fenced code blocks become `%%CODE_<hash>%%` lines and are put back byte for byte.
- **Structure is checked** (`mdx.mjs`): the translation must parse as MDX and keep the English page's inline code, imports, JSX tags and attributes (except `label`/`title`/`alt`/`description`), expressions, directives, link targets, heading levels and front matter (except `title`/`sidebar_label`/`description`). On a mismatch the model gets the problems and one retry; a page that still fails keeps its old translation (or stays English) and the run exits non-zero.
- **Anchors**: every heading gets the `{#id}` of its English heading, so `#links` from any page keep working.
- **Imports**: a page brings along the `_partials` it imports from its own docs folder. Imports leaving the folder point at the translated file when there is one, else at the English file.
- **Vue**: `/es/vue` mirrors the Spanish `docs/core` pages, like `/vue` mirrors `docs/core` (`framework-docs/index.js`).

## Adding a locale or pages

- Pages: edit `pages` in `locales.js` (unset translates every page), then run the script.
- Locale: add it to `locales.js` (Docusaurus picks it up from there), add a glossary in `glossary/<locale>.md`, then run the script.

## Choosing a model

Translating all the docs is about 250K tokens in and out, so every capable model costs a few dollars per full pass and cents per update; pick on quality. Any OpenAI-compatible API (Gemini, DeepSeek, Qwen) works with `TRANSLATE_BASE_URL` and `TRANSLATE_API_KEY`, so candidates can be compared on the same pages:

```bash
TRANSLATE_BASE_URL=https://api.deepseek.com TRANSLATE_API_KEY=... \
  node website/translate/translate.mjs --locale es --model deepseek-chat \
  --out-dir /tmp/deepseek docs/core/getting-started/installation.md
```
