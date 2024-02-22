---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Allow pk() to return numbers

Before:

```ts
class MyEntity extends Entity {
  id = 0;
  pk() {
    return `${this.id}`;
  }
}
```

After:

```ts
class MyEntity extends Entity {
  id = 0;
  pk() {
    return this.id;
  }
}
```
