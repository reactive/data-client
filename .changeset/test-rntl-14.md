---
'@data-client/test': patch
---

Support React Native Testing Library 14

[renderDataHook()](https://dataclient.io/docs/api/renderDataHook) keeps working on React Native after upgrading to `@testing-library/react-native` 14, and stays synchronous, so existing tests need no `await`. Install `test-renderer`, which RNTL 14 needs anyway. Projects on RNTL 13 keep working unchanged.
