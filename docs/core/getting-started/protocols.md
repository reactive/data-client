---
title: Protocol Specific Extensions
---

## REST / CRUD

```bash
yarn add @rest-hooks/rest
```

### Resource

// make this a table

#### Readonly endpoints

- Resource.get
- Resource.getList

#### Mutation endpoints

- Resource.create
- Resource.update
- Resource.partialUpdate
- Resource.delete


## GraphQL


```typescript
class GQLEntity extends Entity {
  readonly id: number = 0;

  pk() { return `${this.id}`; }
}
```

```typescript
const GQL = new Endpoint(
  ()
)
```
