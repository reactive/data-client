---
"@data-client/react": patch
---

Add listen prop to ErrorBoundary and AsyncBoundary

```tsx
<AsyncBoundary listen={history.listen}>
  <MatchedRoute index={0} />
</AsyncBoundary>
```