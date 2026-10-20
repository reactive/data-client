---
title: Cursor Browser Setup
---

Run the [debugging](./devtools-debugging.md) snippets from a Cursor agent. Which tools you have depends on where
the agent runs: check your tool list.

| Agent | Browser tools | Follow |
|---|---|---|
| Desktop (the IDE) | `cursor-ide-browser`: `browser_navigate`, `browser_cdp` | [Desktop agent](#desktop-agent) |
| Cloud agent | none, until Playwright is enabled for the run | [Cloud agent](#cloud-agent) |

If both are listed, either works.

## Desktop agent

The desktop agent drives Cursor's built-in browser (the Browser tab). Docs:
[Browser](https://cursor.com/docs/agent/tools/browser).


1. Open the dev server with `browser_navigate`.
2. Run each snippet with `browser_cdp`, method `Runtime.evaluate`. It evaluates an expression, so call the
   snippet instead of passing it bare:

   - `params.expression`: `(<snippet>)()`
   - `params.awaitPromise`: `true`
   - `params.returnByValue`: `true`

   The tool returns the `Runtime.evaluate` result, and the snippet's value is `result.value`. A bare
   function comes back as a function with no value. An async snippet without `awaitPromise` comes back
   as an empty object.

   Do not send `Page.reload`. It reloads the Cursor window. Open the page again with `browser_navigate`.
3. Read requests with `browser_network_requests` when the tool list includes it. Otherwise run this the same way as step 2 for
   request URLs, durations and statuses (the entries' fields are getters, so map them to plain objects):
   `() => performance.getEntriesByType('resource').map(e => ({ url: e.name, duration: e.duration, status: e.responseStatus }))`.
   `responseStatus` is `0` when CORS blocks the response, and blocked requests can be missing, so check failures in the
   endpoint's `meta` error ([devtools-debugging](./devtools-debugging.md), Step 3) instead.
4. Read logs with `browser_console_messages` when listed. Otherwise read the browser log files Cursor writes for
   the session.

## Cloud agent

A cloud agent does not read `.cursor/mcp.json`. The MCP servers for a run are the ones enabled in the
[MCP dropdown at cursor.com/agents](https://cursor.com/agents) (team servers are under Dashboard → Plugins & MCPs).
Committing the file does not add them. The repo's `.cursor/mcp.json` is for the desktop IDE.

To get Playwright, add this stdio server in that dropdown. The cloud image already runs it: no
`.cursor/environment.json` and no separate browser install. Running this command on a cloud agent exposed
`browser_navigate`, `browser_evaluate`, `browser_network_requests`, and `browser_console_messages`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@0.0.83", "--headless"]
    }
  }
}
```

Then follow [Playwright MCP's Use steps](./browser-playwright-mcp.md#use). If those tools are not in the tool
list, the server is not enabled for this run. The machine's Chrome is still there: drive it over the DevTools
protocol with the same `Runtime.evaluate` parameters as the desktop agent's step 2.
