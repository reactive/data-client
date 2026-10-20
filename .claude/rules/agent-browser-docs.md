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

- `docs/core/_agents/devtools-debugging.md` is the core: every snippet, the three ways a tool runs one (Function, Awaited expression, Expression with the `__DC_RESULT__` recipe), and the requests snippet and console capture for tools without readers. Each `browser-<tool>.md` is a thin adapter: install, how to open the page, which tool runs snippets and which of the three ways it is, its request and console readers (or a link to the core fallbacks), and quirks only that tool has (Cursor's `Page.reload`). Anything that would work in a second tool goes in the core; an adapter links to it rather than copying it.
- A new tool that runs JavaScript in the page is a row in the Browser Tools table plus an adapter page naming one of the three ways. A tool that fits none of them adds a fourth way to the core and to `checkBrowserSnippets.mjs`, not to its adapter.
- Adding, renaming or dropping a tool touches: the Browser Tools table in `devtools-debugging.md`, the agent table in `browser-cursor.md` (Cursor only), the tool names on `getting-started/debugging.md`, `getting-started/agent-skills.md` and `api/DevToolsManager.md`, and both skills' `references.json` plus the reference line in their `SKILL.md`.

## Snippet contract

Every snippet has to work in every adapter, so each one:

- Is a function expression (`() => {}` or `async () => {}`), never an IIFE. `evaluate_script` and `browser_evaluate` call what they're given; Cursor and Claude in Chrome have the agent wrap it as `(<snippet>)()`. Passed bare to Cursor, it returns `{"type":"function","value":{}}` and never runs.
- Returns plain JSON. Cursor's `returnByValue` turns DOM nodes, functions and promises into `{}`. Map actions and `PerformanceEntry`s (getter fields) to plain fields.
- Shares state only through `globalThis.__DC_*`. Any page load clears these: `browser_navigate` (even to the same URL), a reload, or an HMR full reload. Install snippets must be safe to rerun: return early if already installed, cap logs (200, drop half), return `{ ok, ... }`.
- Returns `{ error }` for expected failures instead of throwing. Each adapter reports a throw differently (below), and Cursor reports a rejected promise with `result.value: {}` beside `exceptionDetails`.
- Can't rely on `import('/src/...')`: it only works on native-ESM dev servers (Vite). On webpack it 404s and rejects, so keep a raw-state alternative next to every snippet that imports.
- Prefers sync. Only adapters that await (below) run async snippets in one call.

## Adapters

| Tool | Runs | Async | Throw shows as | Requests | Console | Status |
|---|---|---|---|---|---|---|
| Cursor desktop (`cursor-ide-browser`) | `browser_cdp` `Runtime.evaluate`, `(<snippet>)()` | `awaitPromise: true` | `exceptionDetails` | no tool: `performance` entries | no tool: in-page capture | Live-tested, Cursor 3.25.9 |
| Cursor cloud | Playwright MCP, once enabled at cursor.com/agents | yes | Playwright's | Playwright's | Playwright's | Not live-tested |
| Chrome DevTools MCP | `evaluate_script` (`function`) | yes | not recorded | `list_network_requests` | `list_console_messages` | Checked against source |
| Playwright MCP | `browser_evaluate` (`function`) | yes | not recorded | `browser_network_requests` | `browser_console_messages` | Checked against `@playwright/mcp@0.0.83` source |
| Claude in Chrome | `javascript_tool`, last expression | no: `__DC_RESULT__` wrapper | `__DC_RESULT__.error` | `read_network_requests` | `read_console_messages` | Not live-tested |

Cursor desktop (raw inputs and outputs in [#4428](https://github.com/reactive/data-client/pull/4428#issuecomment-6283999203)):

- Its 16 tools include no network or console reader. `browser_cdp` returns command results only, never CDP events, so `Network.enable`, `Log.enable` and `Runtime.enable` return `{}` and nothing is readable afterward. Cursor writes no browser log files (`.cursor/browser-logs` in the user profile is empty).
- `performance` entries: `responseStatus` is `0` for every cross-origin `no-cors` load (images, fonts), and failed requests can be missing.
- Never send `Page.reload` through `browser_cdp`, not even to test it. It reloads the Cursor window, ends the turn with no response, and the resumed turn re-sent it (two window reloads). Use `browser_navigate`.
- A `browser_navigate` that opens a new tab can return a snapshot of `about:blank`. Take a `browser_snapshot` before trusting the page.
- Every result ends with a non-JSON `Unsupported content type "metadata": {...}` line, so parse only the first content item.
- No call prompted for approval.

## Sharing code between adapters

- Merging the shim and console capture into one install snippet saves a call per page load. It also makes each snippet harder to rerun and read, so only merge them if round trips become the problem.
- Shared install snippets follow Step 1's shape: a `NAME`-style constant at the top for anything the agent sets, an idempotent install, and an `{ ok, ... }` or `{ error, ... }` return.

## Verifying

- Run every change live in the tool it documents, not in a stand-in. Two earlier Cursor claims were checked against plain Chrome CDP and turned out wrong ("browser log files" for console output, "the Agent panel" for the network log).
- `examples/todo-app` (React, webpack) isn't a yarn workspace: `npm ci && npm start` serves it on `:8080`. It uses published packages, so Step 1 reports `actionLog: 'shim'` and `import()` snippets 404.
- `examples/vue-todo-app` (Vite, `npm run dev`) serves `/src/...` for `import()` snippets. Its resources are `src/resources/TodoResource.ts`, not the snippets' illustrative `Todo.ts`.
- `actionLog: 'built-in'` (`__DC_ACTIONS__`) is unreleased (`.changeset/devtools-action-log.md`). Testing it needs an app built against the workspace `packages/`.
- Record raw tool input and output for every behavior you document, so it can become an automated check.
- `yarn check:browser-snippets` (`website/framework-docs/checkBrowserSnippets.mjs`, in the `regenerate` check) runs every snippet in Chromium against an app built from the workspace `packages/`, the ways the adapters do (each of the three ways, reading their parameters and the `__DC_RESULT__` recipe from the core page), plus the console capture and the `Runtime.evaluate` results above. Every snippet needs an `EXPECT` entry. Run it after any snippet change, and turn each newly recorded behavior into a check there. It replays CDP, not the tools themselves, so a new claim about a tool still needs a live run.
