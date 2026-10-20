---
paths:
  - "docs/core/_agents/**"
  - "docs/core/getting-started/debugging.md"
  - "docs/core/getting-started/agent-skills.md"
  - "docs/core/api/DevToolsManager.md"
  - "website/framework-docs/checkBrowserSnippets.mjs"
---
<!-- Generated from .cursor/rules/agent-browser-docs.mdc by `yarn build:agent-rules`. Edit the source. -->


# Agent browser-debugging docs

## Layout

- `docs/core/_agents/devtools-debugging.md` is the core: every snippet, the ways a tool can run one (Browser Tools, whose table is the only list of each tool's runner, way and readers), and fallbacks for tools without request or console readers. Each `browser-<tool>.md` is a thin adapter: install, open the page, which way it runs snippets, and quirks only that tool has. Anything a second tool could use goes in the core.
- A tool that fits none of the ways adds a `###` way to the core and a runner to `WAYS` in `checkBrowserSnippets.mjs`.
- Adding, renaming or dropping a tool touches: the Browser Tools table, the agent table in `browser-cursor.md` (Cursor only), the Status table below, the tool names on `getting-started/debugging.md`, `getting-started/agent-skills.md` and `api/DevToolsManager.md`, and both skills' `references.json` plus the reference line in their `SKILL.md`.

## Snippet contract

Every snippet has to work in every way, so each one:

- Is a function expression (`() => {}` or `async () => {}`), never an IIFE: Function tools call what they're given, and the expression ways have the agent wrap it as `(<snippet>)()`.
- Returns plain JSON: DOM nodes, functions and promises come back as `{}`. Map actions and `PerformanceEntry`s (getter fields) to plain fields.
- Shares state only through `globalThis.__DC_*`, which any page load clears. Install snippets are safe to rerun: return early if installed, cap logs (200, drop half), return `{ ok, ... }`, and put anything the agent sets in a `NAME`-style constant at the top (Step 1's shape).
- Returns `{ error }` for expected failures instead of throwing, since each way reports a throw differently.
- Can't rely on `import('/src/...')`: it only works on native-ESM dev servers (Vite) and rejects on webpack, so keep a raw-state alternative next to every snippet that imports.
- Prefers sync: the Expression way needs two calls for an async snippet.
- Keep the shim and console capture separate: merging saves a call per page load but makes both harder to rerun and read.

## Status

| Tool | Verified |
|---|---|
| Cursor desktop (`cursor-ide-browser`) | Live, Cursor 3.25.9 ([raw results](https://github.com/reactive/data-client/pull/4428#issuecomment-6283999203)) |
| Cursor cloud | Playwright MCP starts on its image (Chrome 154); no live run with the tools enabled yet |
| Playwright MCP | Live on `examples/todo-app` ([#4428](https://github.com/reactive/data-client/pull/4428#issuecomment-6284907053)) |
| Chrome DevTools MCP | Against its source |
| Claude in Chrome | Not live-tested |

Cursor desktop traps the docs don't need to tell agents:

- `browser_cdp` returns command results, never CDP events, and Cursor writes no browser log files (`.cursor/browser-logs` stays empty), so don't look for a network or console log there.
- Never send `Page.reload` through `browser_cdp`, not even to test it: it reloads the Cursor window, ends the turn, and the resumed turn sent it again.
- A `browser_navigate` that opens a new tab can return a snapshot of `about:blank`; take a `browser_snapshot` before trusting the page.
- Every result ends with a non-JSON `Unsupported content type "metadata"` item, so parse only the first content item.

## Verifying

- Run `yarn check:browser-snippets` after any snippet or core change. It replays the ways over CDP in Chromium, not the tools themselves, so a new claim about a tool still needs a live run in that tool: two earlier Cursor claims checked only against plain Chrome CDP were wrong. Record the raw input and output of each live run and turn it into a check in `checkBrowserSnippets.mjs`.
- `examples/todo-app` (React, webpack) isn't a yarn workspace: `npm ci && npm start` serves `:8080`. It uses published packages, so `import()` snippets 404 and Step 1 reports `actionLog: 'shim'` until a release ships `__DC_ACTIONS__` (`.changeset/devtools-action-log.md`).
- `examples/vue-todo-app` (Vite, `npm run dev`) serves `/src/...` for `import()` snippets; its resources are `src/resources/TodoResource.ts`, not the snippets' illustrative `Todo.ts`.
