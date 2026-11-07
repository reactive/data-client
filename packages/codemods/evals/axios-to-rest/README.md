# axios-to-rest migration evals

Each folder holds files copied unchanged from an app that a migration ran the codemod on. The "migration evals" tests
in `src/transforms/__tests__/axios-to-rest.node.js` run the codemod on them and check the pass criterion of the
problem record they reproduce (`.agents/projects/migrations/<app>/problems.md`, added in [#4607](https://github.com/reactive/data-client/pull/4607)).

| Folder              | Source                                                                                                     | License | Records |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------- |
| `bulletproof-react` | [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) @ `9506629`, `apps/react-vite` | MIT     | P9      |

To add a case, copy the app's files under `src/` with its `tsconfig.json` paths and formatter config, then add a
`describe` block for it.

The repo's `.gitignore` ignores `lib` folders, so add an app's `src/lib` with `git add -f`.
