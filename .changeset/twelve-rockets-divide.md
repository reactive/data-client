---
'@data-client/react': patch
---

React Native calls fetches in InteractionManager.runAfterInteractions callback

This reduces the chance of frame drops.