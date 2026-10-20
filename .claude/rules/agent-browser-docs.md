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

- `docs/core/_agents/devtools-debugging.md` is the core: every snippet, the ways a tool can run one (its Browser Tools section, whose table is the one list of each tool's runner, way and readers), and the requests snippet and console capture for tools without readers. Each `browser-<tool>.md` is a thin adapter: install, how to open the page, which tool runs snippets and which way it is, its request and console readers (or a link to the core fallbacks), and quirks only that tool has (Cursor's `Page.reload`). Anything that would work in a second tool goes in the core; an adapter links to it rather than copying it.
- A new tool that runs JavaScript in the page is a row in the Browser Tools table plus an adapter page naming its way. A tool that fits none adds a way (a `###` section) to the core and a runner to `WAYS` in `checkBrowserSnippets.mjs`, not to its adapter.
- Adding, renaming or dropping a tool touches: the Browser Tools table in `devtools-debugging.md`, the agent table in `browser-cursor.md` (Cursor only), the rule's Adapters table, the tool names on `getting-started/debugging.md`, `getting-started/agent-skills.md` and `api/DevToolsManager.md`, and both skills' `references.json` plus the reference line in their `SKILL.md`.

## Snippet contract

Every snippet has to work in every adapter, so each one:

- Is a function expression (`() => {}` or `async () => {}`), never an IIFE. Function tools call what they're given; the expression ways have the agent wrap it as `(<snippet>)()`. Passed bare to an expression tool, it returns `{"type":"function","value":{}}` and never runs.
- Returns plain JSON. Cursor's `returnByValue` turns DOM nodes, functions and promises into `{}`. Map actions and `PerformanceEntry`s (getter fields) to plain fields.
- Shares state only through `globalThis.__DC_*`. Any page load clears these: `browser_navigate` (even to the same URL), a reload, or an HMR full reload. Install snippets must be safe to rerun: return early if already installed, cap logs (200, drop half), return `{ ok, ... }`.
- Returns `{ error }` for expected failures instead of throwing. Each way reports a throw differently (see the core's sections).
- Can't rely on `import('/src/...')`: it only works on native-ESM dev servers (Vite). On webpack it 404s and rejects, so keep a raw-state alternative next to every snippet that imports.
- Prefers sync. Only the ways that await (Function, Awaited expression) run async snippets in one call.
- Merging the shim and console capture into one install snippet saves a call per page load. It also makes each snippet harder to rerun and read, so only merge them if round trips become the problem.
- Shared install snippets follow Step 1's shape: a `NAME`-style constant at the top for anything the agent sets, an idempotent install, and an `{ ok, ... }` or `{ error, ... }` return.

## Adapters

The Browser Tools table in the core lists each tool's runner, way and readers. What it doesn't carry:

| Tool | Throw shows as | Status |
|---|---|---|
| Cursor desktop (`cursor-ide-browser`) | `exceptionDetails` | Live-tested, Cursor 3.25.9 |
| Cursor cloud | Playwright's | Not live-tested |
| Chrome DevTools MCP | not recorded | Checked against source |
| Playwright MCP | not recorded | Checked against `@playwright/mcp@0.0.83` source |
| Claude in Chrome | `__DC_RESULT__.error` | Not live-tested |

Cursor desktop (raw inputs and outputs in [#4428](https://github.com/reactive/data-client/pull/4428#issuecomment-6283999203)):

- Its 16 tools include no network or console reader. `browser_cdp` returns command results only, never CDP events, so `Network.enable`, `Log.enable` and `Runtime.enable` return `{}` and nothing is readable afterward. Cursor writes no browser log files (`.cursor/browser-logs` in the user profile is empty).
- `performance` entries: `responseStatus` is `0` for every cross-origin `no-cors` load (images, fonts), and failed requests can be missing.
- Never send `Page.reload` through `browser_cdp`, not even to test it. It reloads the Cursor window, ends the turn with no response, and the resumed turn re-sent it (two window reloads). Use `browser_navigate`.
- A `browser_navigate` that opens a new tab can return a snapshot of `about:blank`. Take a `browser_snapshot` before trusting the page.
- Every result ends with a non-JSON `Unsupported content type "metadata": {...}` line, so parse only the first content item.
- No call prompted for approval.

## Verifying

- Run every change live in the tool it documents, not in a stand-in. Two earlier Cursor claims were checked against plain Chrome CDP and turned out wrong ("browser log files" for console output, "the Agent panel" for the network log).
- `examples/todo-app` (React, webpack) isn't a yarn workspace: `npm ci && npm start` serves it on `:8080`. It uses published packages, so Step 1 reports `actionLog: 'shim'` and `import()` snippets 404.
- `examples/vue-todo-app` (Vite, `npm run dev`) serves `/src/...` for `import()` snippets. Its resources are `src/resources/TodoResource.ts`, not the snippets' illustrative `Todo.ts`.
- `actionLog: 'built-in'` (`__DC_ACTIONS__`) is unreleased (`.changeset/devtools-action-log.md`). Testing it needs an app built against the workspace `packages/`.
- Record raw tool input and output for every behavior you document, so it can become an automated check.
- `yarn check:browser-snippets` (`website/framework-docs/checkBrowserSnippets.mjs`, in the `regenerate` check) runs every snippet in Chromium against an app built from the workspace `packages/`, each way the core lists (reading their parameters and the `__DC_RESULT__` recipe from it), plus the console capture and the `Runtime.evaluate` results above. Every snippet needs an `EXPECT` entry. Run it after any snippet change, and turn each newly recorded behavior into a check there. It replays CDP, not the tools themselves, so a new claim about a tool still needs a live run.
