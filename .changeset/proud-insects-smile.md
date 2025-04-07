---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/core': minor
'@data-client/graphql': minor
'@data-client/react': minor
'@data-client/rest': minor
---

BREAKING CHANGE: schema.normalize(...args, addEntity, getEntity, checkLoop) -> schema.normalize(...args, delegate)

We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

```ts
/** Helpers during schema.normalize() */
export interface INormalizeDelegate {
  /** Action meta-data for this normalize call */
  readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  /** Gets any previously normalized entity from store */
  getEntity: GetEntity;
  /** Updates an entity using merge lifecycles when it has previously been set */
  mergeEntity(
    schema: Mergeable & { indexes?: any },
    pk: string,
    incomingEntity: any,
  ): void;
  /** Sets an entity overwriting any previously set values */
  setEntity(
    schema: { key: string; indexes?: any },
    pk: string,
    entity: any,
    meta?: { fetchedAt: number; date: number; expiresAt: number },
  ): void;
  /** Returns true when we're in a cycle, so we should not continue recursing */
  checkLoop(key: string, pk: string, input: object): boolean;
}
```

#### Before

```ts
addEntity(this, processedEntity, id);
```

#### After

```ts
delegate.mergeEntity(this, id, processedEntity);
```