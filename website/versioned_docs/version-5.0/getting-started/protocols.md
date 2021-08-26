---
title: Protocol Specific Extensions
id: version-5.0-protocols
original_id: protocols
---

## REST / CRUD

```bash
yarn add @rest-hooks/rest
```

### Resource

// make this a table

#### Readonly endpoints

- Resource.detail()
- Resource.list()

#### Mutation endpoints

- Resource.create()
- Resource.update()
- Resource.partialUpdate()
- Resource.delete()


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
