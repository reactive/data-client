---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix polling from `controller.subscribe()` staying stopped after `<Activity>` hides `DataProvider`

When [`<Activity>`](https://react.dev/reference/react/Activity) hid a `DataProvider`,
[SubscriptionManager](https://dataclient.io/docs/api/SubscriptionManager) stopped every polling subscription and
never restarted it. Subscriptions from [useSubscription()](https://dataclient.io/docs/api/useSubscription) already
recovered, because their component subscribes again. A subscription made with
[controller.subscribe()](https://dataclient.io/docs/api/Controller#subscribe) now resumes polling too.

A custom [Subscription](https://dataclient.io/docs/api/SubscriptionManager#subscription) can add `init()` to resume
work that `cleanup()` stopped:

```ts
class StreamSubscription implements Subscription {
  // ...
  cleanup() {
    this.socket?.close();
    this.socket = undefined;
  }
  init() {
    this.socket ??= this.connect();
  }
}
```
