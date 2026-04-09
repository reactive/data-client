---
'@data-client/react': patch
'@data-client/test': patch
---

Align dev peer `react-native` with 0.85 and update the monorepo Jest React Native project to use `@react-native/jest-preset` paths (resolver, setup, env, asset transformer). Pin `react` / `react-dom` / `react-test-renderer` to 19.2.3 so they match the renderer shipped with React Native 0.85.
