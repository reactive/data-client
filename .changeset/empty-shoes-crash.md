---
'@data-client/react': minor
'@data-client/core': minor
---

Add controller.set()

```ts
ctrl.set(Todo, { id: '5' }, { id: '5', title: 'tell me friends how great Data Client is' });
```

BREAKING CHANGE:
- actionTypes.SET_TYPE -> actionTypes.SET_RESPONSE_TYPE
- SetAction -> SetResponseAction