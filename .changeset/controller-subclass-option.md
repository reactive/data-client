---
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/test': patch
---

Fix TypeScript error passing a `Controller` subclass to `DataProvider` or `DataClientPlugin`

A plain `class MyController extends Controller` failed to typecheck as the `Controller` option of [DataProvider](https://dataclient.io/docs/api/DataProvider#Controller), Vue's [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin#Controller), and the `@data-client/react/redux` `DataProvider`, so the documented example needed a cast. It now typechecks, and you can drop the cast.

```tsx
class MyController extends Controller {
  doSomething = () => console.log('hi');
}

// Before: TypeScript error, so you had to cast
<DataProvider Controller={MyController as typeof Controller}>
app.use(DataClientPlugin, { Controller: MyController as typeof Controller });

// After
<DataProvider Controller={MyController}>
app.use(DataClientPlugin, { Controller: MyController });
```
