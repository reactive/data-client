---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/graphql': minor
'@data-client/rest': minor
'@data-client/react': patch
'@data-client/core': patch
---

Change Schema.normalize `visit()` interface; removing non-contextual arguments.

```ts
/** Visits next data + schema while recurisvely normalizing */
export interface Visit {
  (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
  creating?: boolean;
}
```

This results in a 10% normalize performance boost.

```ts title="Before"
processedEntity[key] = visit(
  processedEntity[key],
  processedEntity,
  key,
  this.schema[key],
  addEntity,
  visitedEntities,
  storeEntities,
  args,
);
```

```ts title="After"
processedEntity[key] = visit(
  this.schema[key],
  processedEntity[key],
  processedEntity,
  key,
  args,
);
```

The information needed from these arguments are provided by [closing](https://en.wikipedia.org/wiki/Closure_(computer_programming)) `visit()` around them.