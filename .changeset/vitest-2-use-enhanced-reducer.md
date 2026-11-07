---
'@data-client/use-enhanced-reducer': patch
'@data-client/react': patch
---

Fix `DataProvider` crashing in Vitest 2 tests

With Vitest 2 and the `jsdom` environment, rendering `DataProvider` threw
`TypeError: useEnhancedReducer is not a function or its return value is not iterable`
unless the app inlined Data Client with `server.deps.inline`. It now renders with Vitest's default config, so you can
remove that workaround:

```ts title="vite.config.ts"
export default defineConfig({
  test: {
    environment: 'jsdom',
    // no longer needed
    // server: { deps: { inline: [/@data-client/] } },
  },
});
```
