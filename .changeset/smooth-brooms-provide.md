---
"@data-client/react": patch
---

Only show devtools button when DevToolsManager is used

Previously, one could use custom managers list and it
would still show the devtools button. This was confusing
as opening it would show no instance for Data Client.