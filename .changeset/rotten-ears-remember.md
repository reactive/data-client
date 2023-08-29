---
'@data-client/rest': minor
---

getPage,push,unshift,assign should not match name of parent

```ts
const getTodos = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  schema: new schema.Collection([Todo]),
  name: 'gettodos',
});

getTodos.getPage.name === 'gettodos.getPage';
getTodos.push.name === 'gettodos.create';
getTodos.unshift.name === 'gettodos.create';
```
