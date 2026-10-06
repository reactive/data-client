---
'@data-client/react': patch
---

Fix TypeScript error passing `prepareStore()`'s store to react-redux's `<Provider>`

`prepareStore()` from `@data-client/react/redux` typed its `store` as a minimal object with only `getState()` and `subscribe()`, so [using it with React-Redux](https://dataclient.io/docs/guides/redux) needed a cast, and `store.dispatch()` was a TypeScript error. It's now typed as a Redux `Store`, and also has the `replaceReducer()` and `[Symbol.observable]()` that react-redux's `Store` type requires.

```tsx
const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

// Before: TypeScript error, so you had to cast
<Provider store={store as any}>

// After
<Provider store={store}>
```
