---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

Fix `data-client-skills` linking skills inside a workspace package instead of the workspace root

Agents started at the root of a monorepo load the root's skills at startup, but a package's nested skills only once they work on its files. Running `npx --no data-client-skills` in `apps/web` of a workspace now links the skills in the root's `.agents/skills`, and in `apps/web` only the skills it installs at a different version than the root, under Yarn Plug'n'Play too. Workspace patterns with `{a,b}` groups now match, as npm reads them. For an app in a subfolder of a repo without workspaces, it says to start the agent in the app's folder.
