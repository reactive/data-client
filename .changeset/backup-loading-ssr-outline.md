---
'@data-client/react': patch
---

Fix "Uncaught suspense" warning during React 19 server rendering when nothing suspended

Server rendering with React 19 could log "Uncaught suspense" even though every boundary finished rendering. The warning now only appears in the browser, when a fallback actually shows.
