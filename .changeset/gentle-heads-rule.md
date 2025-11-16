---
'@data-client/vue': patch
---

Add MockPlugin

Example usage:

```ts
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { MockPlugin } from '@data-client/vue/test';

const app = createApp(App);
app.use(DataClientPlugin);
app.use(MockPlugin, {
  fixtures: [
    {
      endpoint: MyResource.get,
      args: [{ id: 1 }],
      response: { id: 1, name: 'Test' },
    },
  ],
});
app.mount('#app');
```

Interceptors allow dynamic responses based on request arguments:

```ts
app.use(MockPlugin, {
  fixtures: [
    {
      endpoint: MyResource.get,
      response: (...args) => {
        const [{ id }] = args;
        return {
          id,
          name: `Dynamic ${id}`,
        };
      },
    },
  ],
});
```

Interceptors can also maintain state across calls:

```ts
const interceptorData = { count: 0 };

app.use(MockPlugin, {
  fixtures: [
    {
      endpoint: MyResource.get,
      response: function (this: { count: number }, ...args) {
        this.count++;
        const [{ id }] = args;
        return {
          id,
          name: `Call ${this.count}`,
        };
      },
    },
  ],
  getInitialInterceptorData: () => interceptorData,
});
```
