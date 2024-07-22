---
'@data-client/core': patch
'@data-client/react': patch
---

NetworkManager constructor uses keyword args

#### Before

```ts
new NetworkManager(42, 7);
```

#### After

```ts
new NetworkManager({ dataExpiryLength: 42, errorExpiryLength: 7 });
```