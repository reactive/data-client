---
'@data-client/vue': patch
---

Fix `useSuspense()` and `useLive()` fetch errors after arguments change being unhandled

When ref or computed arguments changed and the new fetch failed, the error became an unhandled promise rejection
and the result became `undefined`. Reading the result now throws the error, like the first load does, so it reaches
`onErrorCaptured()`.

```ts
const props = defineProps<{ id: number }>();
const todo = await useSuspense(
  TodoResource.get,
  computed(() => ({ id: props.id })),
);
// Before: a failed fetch for a new id was an unhandled rejection; todo.value became undefined
// After: reading todo.value throws the fetch error, caught by onErrorCaptured()
```
