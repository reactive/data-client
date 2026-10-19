---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

Ship agent skills inside the packages

Coding agents can now follow the skills for the version you have installed instead of guessing from older releases. Each package carries the skills it covers, and the new `data-client-skills` command (in `@data-client/react` and `@data-client/vue`) links them into `.claude/skills`, where Claude Code and Cursor load them as their own:

```bash
npx --no data-client-skills
```

Commit the links. They point into `node_modules`, so upgrades need nothing more; run it again after adding or removing `@data-client` packages. [TanStack Intent](https://tanstack.com/intent) also finds these skills.
