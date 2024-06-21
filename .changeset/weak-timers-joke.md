---
'@data-client/react': patch
---

Fix React Native use correct native specific modules

Fully realized path names (including .js at end of import)
was breaking [platform specific extensions](https://docs.expo.dev/router/advanced/platform-specific-modules/#platform-specific-extensions). To workaround this issue, we
simply create a custom react-native build that remaps any
imports with full extension written ("file.native.js")