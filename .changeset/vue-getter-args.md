---
'@data-client/vue': patch
---

Fix getter function arguments in Vue composables

`useSuspense`, `useLive`, `useCache`, `useDLE`, `useFetch`, `useQuery` and `useSubscription`
were typed to accept getter functions as arguments, but only resolved refs at runtime. Getters
now work and are tracked reactively, just like refs and `computed`.

```ts
const props = defineProps<{ id: number }>();

// Before: getter was passed to the endpoint as-is
// After: re-fetches when props.id changes
const article = await useSuspense(ArticleResource.get, () => ({ id: props.id }));
```

Requires Vue 3.3 or later (the `vue` peer dependency is now `^3.3.0`).
