---
title: TypeScript 标准 Endpoint
sidebar_label: 自定义协议
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# TypeScript 标准 Endpoint

[Endpoint](/rest/api/Endpoint) 用于描述一个异步 [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/)。它包含 API 的运行时行为，以及（可选的）类型。

<PkgTabs pkgs="@data-client/endpoint" />

<LanguageTabs>

```typescript
interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
interface Params {
  id: number;
}

const fetchTodoDetail = ({ id }: Params): Promise<Todo> =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

// highlight-next-line
const todoDetail = new Endpoint(fetchTodoDetail);
```

```js
const fetchTodoDetail = ({ id }) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

// highlight-next-line
const todoDetail = new Endpoint(fetchTodoDetail);
```

</LanguageTabs>


<details>
<summary><b>使用示例</b></summary>

```js
console.log(await todoDetail({ id: '1' }));
```

<samp>

```json
{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed": false
}
```

</samp>

</details>

endpoint *只*包含网络定义，因此任何组件都可以使用它。你为它添加的每一项信息（比如 TypeScript 类型）
都会惠及所有使用它的地方：类型能捕获拼写错误，并提供自动补全。

接口只需定义一次，就能在任何地方使用。这消除了样板代码和错误，并让整个应用中的数据
保持一致。

## 不只是一个函数 {#more-than-just-a-function}

[Endpoint](/rest/api/Endpoint) 同时也是一个对象，因此可以保存关于 endpoint 的更多信息。

例如，[key()](/rest/api/Endpoint#key) 会把 endpoint 及其参数序列化为一个唯一的字符串。缓存
用它来存储响应，并判断参数何时发生了变化。

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail [{"id":"1"}]
```

### 成员 {#members}

可选的第二个参数用于设置 endpoint 的成员。请使用方法而不是箭头函数，这样
[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) 才能读取其他成员。

```js
const todoDetailWithCustomizedKey = new Endpoint(fetchTodoDetail, {
  key({ id }) {
    return `${this.endpointIdentifier}/${id}`;
  },
  endpointIdentifier: 'todoDetail',
});
```

```js
console.log(todoDetailWithCustomizedKey.key({ id: '1' }));
// todoDetail/1
```

### Endpoint.extend() {#endpointextend}

[extend()](/rest/api/Endpoint#extend) 会创建一个继承原 endpoint 成员的新 endpoint，并且类型正确。
用它可以在整个 API 中共享身份认证等模式。

这个示例修改了 [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) 成员：

```js
const fetchTodoDetail = function ({ id }) {
  return fetch(`${this.urlBase}/todos/${id}`, { method: this.method }).then(
    res => res.json(),
  );
};

const todoDetail = new Endpoint(fetchTodoDetail, {
  method: 'GET',
  urlBase: 'https://jsonplaceholder.typicode.com',
});
```

```js
const todoCreate = todoDetail.extend({ method: 'POST' });
const todoUpdate = todoDetail.extend({ method: 'PUT' });
```
