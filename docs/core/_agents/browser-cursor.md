---
title: Cursor Browser Setup
---

Run the [debugging](./devtools-debugging.md) snippets with Cursor's built-in browser (the Browser tab,
`cursor-ide-browser` tools). Docs: [Browser](https://cursor.com/docs/agent/tools/browser).

Cloud agents and CI have no `cursor-ide-browser` tools. Add [Playwright MCP](./browser-playwright-mcp.md)
to `.cursor/mcp.json` (see its Install section) and use that instead.

## Use

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
