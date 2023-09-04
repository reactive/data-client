---
'@data-client/react': patch
---

Add button to open devtools in development mode

Can be disabled or location configured using `devButton` [CacheProvider](https://dataclient.io/docs/api/CacheProvider)
property

```tsx
<CacheProvider devButton={null}>
  <App/>
</CacheProvider>
```

```tsx
<CacheProvider devButton="top-right">
  <App/>
</CacheProvider>
```
