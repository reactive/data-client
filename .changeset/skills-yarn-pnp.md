---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

Fix `yarn data-client-skills` leaving broken skill links in Yarn Plug'n'Play apps

It now copies the skills into `.agents/skills`, so your agent can read them. Run it again to replace links an earlier version made.
