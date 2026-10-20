---
title: Claude in Chrome Setup
---

Run the [debugging](./devtools-debugging.md) snippets with Claude in Chrome, the browser extension that acts in
your own Chrome.

## Use

1. Open the dev server in a tab with `navigate`.
2. Run each snippet with `javascript_tool` as an [expression](./devtools-debugging.md#expression).
3. Read requests with `read_network_requests` (pass `urlPattern` to narrow them) and logs with
   `read_console_messages`.
