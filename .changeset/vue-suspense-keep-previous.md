---
'@data-client/vue': patch
---

Fix `useSuspense()` and `useLive()` returning `undefined` while new arguments load

When ref or computed arguments changed to data not yet in the store, the result became `undefined` until the
new fetch resolved, crashing templates like `{{ todo.title }}`. It now keeps the previous data until the new data arrives.

```ts
const props = defineProps<{ id: number }>();
const todo = await useSuspense(TodoResource.get, computed(() => ({ id: props.id })));
// Before: todo.value was undefined while the new id loaded
// After: todo.value keeps the previous todo until the new one arrives
```
