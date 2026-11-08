---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

`data-client-skills` links skills at the workspace root when run in a workspace package

Agents started at the root of a monorepo load the root's skills at startup, but a package's nested skills only once they work on its files. Running `npx --no data-client-skills` in `apps/web` of a workspace now links the skills in the root's `.agents/skills`. For an app in a subfolder of a repo without workspaces, it says to start the agent in the app's folder.
