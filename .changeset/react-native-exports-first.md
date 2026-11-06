---
'@data-client/react': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/test': patch
---

Fix React Native apps loading the web builds

React Native (Metro and Jest) now gets the React Native code, such as focus refetching with React Navigation.

BREAKING: In React Native Jest, `@data-client/test` renders hooks with React Native Testing Library instead of `@testing-library/react-hooks`.
