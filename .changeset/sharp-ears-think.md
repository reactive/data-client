---
"@data-client/endpoint": minor
"@data-client/rest": minor
"@data-client/graphql": minor
---

BREAKING: Entity.useIncoming → [Entity.shouldUpdate](https://dataclient.io/rest/api/Entity#shouldupdate))

```ts title="Before"
class MyEntity extends Entity {
  // highlight-next-line
  static useIncoming(
    existingMeta: { date: number },
    incomingMeta: { date: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEquals(existing, incoming);
  }
}
```

```ts title="After"
class MyEntity extends Entity {
  // highlight-next-line
  static shouldUpdate(
    existingMeta: { date: number },
    incomingMeta: { date: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEquals(existing, incoming);
  }
}
```