---
'@data-client/core': patch
'@data-client/react': patch
---

Allow ctrl.set() value to be a function

This [prevents race conditions](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

```ts
const id = '2';
ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
```

Note: the response must include values sufficient to compute Entity.pk()