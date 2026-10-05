# Vue Data Client Testing Utilities

`@data-client/vue/test` provides testing utilities for Vue applications using `@data-client/vue`,
similar to `@data-client/test` for React.

- `mountDataClient()` mounts a component with `DataClientPlugin`, `<Suspense>` and fixtures:
  [Unit testing components](https://dataclient.io/vue/guides/unit-testing-components)
- `renderDataCompose()` runs a composable the same way:
  [Unit testing composables](https://dataclient.io/vue/guides/unit-testing-hooks)
- `mockInitialState()` builds store state from fixtures:
  [mockInitialState](https://dataclient.io/vue/api/mockInitialState)
- Fixture and interceptor formats: [Fixtures](https://dataclient.io/vue/api/Fixtures)
