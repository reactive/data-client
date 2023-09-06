---
'@data-client/core': patch
'@data-client/react': patch
---

Better track state changes between each action

Since React 18 batches updates, the real state can
sometimes update from multiple actions, making it harder
to debug. When devtools are open, instead of getting
the real state - track a shadow state that accurately reflects
changes from each action.