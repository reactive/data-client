---
'@data-client/react': patch
---

Add the `data-client-performance` agent skill

It runs the new [Performance pass](https://dataclient.io/docs/guides/performance-pass): it finds the speedups an app
is missing and makes them, except any you opt out of. Use it after a migration, or on any app that already uses Data
Client. Run `npx --no data-client-skills` after upgrading to link it.
