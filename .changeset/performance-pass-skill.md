---
'@data-client/react': patch
---

Add the `data-client-performance` agent skill

It runs the new [Performance pass](https://dataclient.io/docs/guides/performance-pass) as an audit: it finds the
speedups an app is missing, such as detail pages from list data, loaders that wait only for the first view,
optimistic updates and Query memoization, then makes the ones you pick. Use it after a migration, or on any app that
already uses Data Client. Run `npx --no data-client-skills` after upgrading to link it.
