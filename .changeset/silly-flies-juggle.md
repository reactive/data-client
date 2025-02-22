---
'@data-client/test': patch
---

fix: Interceptors work on manager-dispatched actions.

For example, renderHook now can use resolverFixtures to resolve fetches for subscriptions.
This was not possible before as SubscriptionManager's dispatches would not be intercepted with the
previous implementation.
