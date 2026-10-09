---
title: TypeScript 标准 Endpoint
sidebar_label: 自定义协议
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# TypeScript 标准 Endpoint

[Endpoint](/rest/api/Endpoint) 用于描述一个异步 [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/)。它既包括运行时行为，也（可选地）包括类型。

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

我们很可能会在许多需求各异的地方使用这个 endpoint。
通过定义一个*只*包含网络定义的可复用函数，我们就能在*任何*上下文中
使用它。

当我们开始为 endpoint 添加更多相关信息时，这一点尤其有用。
例如，TypeScript 定义可以帮助我们避免常见错误和拼写错误，
并借助自动补全加快开发速度。

通过让接口定义*紧耦合*、而让其使用方式*松耦合*，
我们减少了样板代码、复杂度和常见错误，同时提升了性能，
并且即使面对不可靠的异步数据，也能保证整个应用的一致性与完整性。

## 不只是一个函数 {#more-than-just-a-function}

除了异步函数和（可选的）类型之外，[Endpoint](/rest/api/Endpoint) 还是对象，
因此可以提供关于 endpoint 本身的任何其他相关信息。

例如，为了能集成到缓存中，并在参数变化时知道何时重新计算和/或重新获取，
Endpoint 拥有一个 [key()](/rest/api/Endpoint#key) 成员，它会把
endpoint 和参数序列化为一个唯一的字符串。

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail {"id":"1"}
```

### 成员 {#members}

第二个可选参数是用于初始化 endpoint 的对象。只要不使用箭头函数，
我们就可以用 [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
访问我们定义的其他成员。

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

为方便起见，[extend()](/rest/api/Endpoint#extend) 支持以类型正确的方式
通过原型继承来扩展 endpoint。

当 API 已经形成了固定的模式（例如身份认证）时，这可以大大减少
样板代码。

下面展示自定义 [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) 成员的好处。

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
