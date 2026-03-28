---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add [schema.Lazy](https://dataclient.io/rest/api/Lazy) for deferred relationship denormalization.

`schema.Lazy` wraps a relationship field so denormalization returns raw primary keys
instead of resolved entities. Use `.query` with [useQuery](/docs/api/useQuery) to
resolve on demand in a separate memo/GC scope.

New exports: `schema.Lazy`, `Lazy`

```ts
class Department extends Entity {
  buildings: string[] = [];
  static schema = {
    buildings: new schema.Lazy([Building]),
  };
}

// dept.buildings = ['bldg-1', 'bldg-2'] (raw PKs)
const buildings = useQuery(Department.schema.buildings.query, dept.buildings);
```
