---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/use-enhanced-reducer': minor
---

BREAKING: [Manager.cleanup()](https://dataclient.io/docs/api/Manager#cleanup) no longer means the store is gone

When React [`<Activity>`](https://react.dev/reference/react/Activity) hides a `DataProvider`, it calls each Manager's `cleanup()` but keeps the store. The store keeps applying actions, and showing it calls `init()` again. React StrictMode also calls `cleanup()` then `init()` on the same store. So in a custom Manager:

- Start timers and connections in `init()`, and stop them in `cleanup()`.
- Keep state about the store (like requests in flight) in `cleanup()`.
- Expect actions after `cleanup()`. Guard side effects with a field `cleanup()` clears, like `this.channel?.postMessage()`.

A Manager that started an interval in `middleware` never restarted it after a hide and show:

```ts title="Before"
middleware: Middleware = controller => {
  this.intervalID = setInterval(() => {
    controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
  }, 1000);
  return next => async action => next(action);
};

cleanup() {
  clearInterval(this.intervalID);
}
```

```ts title="After"
middleware: Middleware = controller => {
  this.controller = controller;
  return next => async action => next(action);
};

init() {
  this.intervalID = setInterval(() => {
    this.controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
  }, 1000);
}

cleanup() {
  clearInterval(this.intervalID);
}
```

[NetworkManager](https://dataclient.io/docs/api/NetworkManager) resolves responses that arrive after `cleanup()`. `NetworkManager.cleanupDate` is deprecated: nothing reads it now. Delete code that reads or sets it.

On React 18 and later, actions dispatched after a `DataProvider` really unmounts now reach its Managers, so a `fetch()` there is sent. React ignores the store update, so promises that wait for it never resolve: `set()`, `setResponse()`, `resetEntireStore()`, and `fetch()` of an endpoint without `sideEffect`. Don't `await` them after unmount. React 16 and 17 still drop these actions.

Why: `cleanup()` used to stop dispatches because React 16/17 warn about state updates after unmount. React 18 removed that warning, and an Effect cleanup can't tell hiding from unmounting.
