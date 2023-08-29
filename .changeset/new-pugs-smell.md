---
'@data-client/react': minor
---

Add className to error boundary and errorClassName to AsyncBoundary


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