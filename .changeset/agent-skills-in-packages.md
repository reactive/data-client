---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

Ship agent skills inside the packages

Coding agents can now follow the skills for the version you have installed instead of guessing from older releases. Each package carries the skills it covers, and [TanStack Intent](https://tanstack.com/intent) tells your agent to load them:

```bash
npm install -D @tanstack/intent
npx intent install
```
