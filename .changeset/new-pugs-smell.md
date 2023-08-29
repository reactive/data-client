---
'@data-client/react': minor
---

Add className to error boundary and errorClassName to [AsyncBoundary](https://dataclient.io/docs/api/AsyncBoundary)


```tsx
<AsyncBoundary errorClassName="error">
  <Stuff/>
</AsyncBounary>
```

```tsx
<NetworkErrorBoundary className="error">
  <Stuff/>
</NetworkErrorBoundary>
```