---
'@data-client/react': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/test': patch
---

React Native apps now load the React Native builds

Metro and Jest pick the first `exports` condition that matches, and `react-native` was listed after `require` and `import`. So React Native apps loaded the web builds: web hooks and components from `@data-client/react` (for example, no focus refetching with React Navigation and no `InteractionManager` scheduling), and the web code of `@data-client/endpoint` and `@data-client/rest`. Now `react-native` is the first condition, and it points to new CommonJS builds that use the React Native code. They also work in Jest with `@react-native/jest-preset`, which does not compile `node_modules`.

In Jest with `@react-native/jest-preset`, `@data-client/test` now renders hooks with React Native Testing Library (with `test-renderer` when installed) instead of `@testing-library/react-hooks`.
