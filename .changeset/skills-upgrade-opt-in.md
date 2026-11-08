---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

`data-client-skills` links upgrade skills only with `--upgrade`

A new app no longer gets the v0.18 and path-to-regexp v8 migration skills, which only apply when upgrading from an older version. When you upgrade, link them too, and run it again without `--upgrade` once you're done to remove them:

```bash
npx --no data-client-skills --upgrade
```
