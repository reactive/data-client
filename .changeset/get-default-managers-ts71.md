---
'@data-client/react': patch
---

Fix `getDefaultManagers()` typechecking on TypeScript 7.1

TypeScript 7.1 reported `Binding element 'networkManager' implicitly has an 'any' type` when checking [getDefaultManagers()](https://dataclient.io/docs/api/getDefaultManagers). That error is gone. Calls such as `getDefaultManagers({ devToolsManager: null })` are unchanged.
