---
'@data-client/core': patch
'@data-client/test': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fixture `args` accept readonly tuples

Fixtures written with `args: [...] as const` now type-check when passed to [MockResolver](https://dataclient.io/docs/api/MockResolver), `renderDataHook()`, Vue's `renderDataCompose()` or `mockInitialState()`. Before, TypeScript rejected them with "The type 'readonly [...]' is 'readonly' and cannot be assigned to the mutable type", so you had to drop `as const` or cast.

```ts
const fixtures = [
  {
    endpoint: TodoResource.getList,
    args: [{ userId: 1 }] as const,
    response: [{ id: 1, title: 'Write tests', userId: 1 }],
  },
];

// Before: type error on `fixtures`. After: works as written
<MockResolver fixtures={fixtures}>
  <TodoList />
</MockResolver>;
```
