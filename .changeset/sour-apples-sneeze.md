---
"@data-client/normalizr": minor
---

BREAKING CHANGE: WeakEntityMap -> WeakDependencyMap

We generalize this data type so it can be used with other dependencies.

```ts title="Before"
new WeakEntityMap();
```

```ts title="After"
new WeakDependencyMap<EntityPath>();
```