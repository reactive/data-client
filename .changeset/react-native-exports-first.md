---
'@data-client/react': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
---

Fix React Native apps loading the web builds

React Native (Metro and Jest) now gets the React Native code, such as focus refetching with React Navigation.
Apps without React Navigation, like Expo Router apps, keep working.
