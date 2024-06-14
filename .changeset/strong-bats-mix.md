---
'@data-client/react': patch
---

Fix commonjs builds to keep same context instance

There must be only one instance of a context, so we need to ensure our new entrypoints don't include createContext