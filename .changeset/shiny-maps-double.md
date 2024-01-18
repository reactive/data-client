---
"@data-client/core": patch
---

Limit DevToolsManager action buffer depth to 100

This will avoid memory leaks in long running applications, or ones with frequent updates.