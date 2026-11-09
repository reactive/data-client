---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/use-enhanced-reducer': patch
---

`controller.snapshot()` reads the store as components show it

Snapshots now include pending [optimistic updates](https://dataclient.io/rest/guides/optimistic-updates), and `state` is optional (by default, the latest committed state). Before, event handlers, Effects and thunks that read the store missed them, so a guard like "already marked read?" saw stale data and sent the request again.

```ts
const ctrl = useController();

const markRead = (id: string) => {
  // includes a markRead still in flight
  if (ctrl.snapshot().get(Post, { id })?.read) return;
  return ctrl.fetch(PostResource.partialUpdate, { id }, { read: true });
};
```

`controller.getState()` still leaves out optimistic updates, so [Managers](https://dataclient.io/docs/api/Manager) see only data the server confirmed.

With [DataProvider](https://dataclient.io/docs/api/DataProvider), `getState()` in a child's Effect now returns the state that rendered, not the one before it. It also updates while `<Activity>` hides the provider.
