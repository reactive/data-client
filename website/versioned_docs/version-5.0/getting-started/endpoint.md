---
title: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';

[Endpoints](../api/Endpoint.md) describe an asynchronous [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/). This includes both runtime behavior as well as (optionally) typing.

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


<details><summary><b>Example Usage</b></summary>

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

We will likely want to use this endpoint in many places with differing needs.
By defining a reusable function of _just_ the network definition, we empower
its use in _any_ context.

This is especially useful when we start adding more information related to the
endpoint. For instance, TypeScript definitions help us avoid common mistakes, typos
and speed up development with autocomplete.

By _tightly coupling_ the interface definition, while _loosely coupling_ its usage,
we reduce boilerplate, complexity, and common mistakes, while increasing performance and
enabling global application consistency and integrity even in the face of unreliable
asynchronous data.

## More than just a function

In addition to an async function and (optional) types, [Endpoint](../api/Endpoint.md)s are objects,
allowing them to provide any additional relevant information about the endpoint itself.

For instance, to allow integration into a cache as well as knowing when to recompute and/or refetch
when parameters change, Endpoints have a [key()](../api/Endpoint.md#key-params--string) member that serializes
the endpoint and parameters to a unique string.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail {"id":"1"}
```

### Members

The second optional arg is an object to initialize the endpoint with. By avoiding arrow functions,
we can use [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
to access other members we defined.

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

### Endpoint.extend()

For convenience, [extend()](../api/Endpoint.md#extendendpointoptions-endpoint) allows type-correct
prototypical inheritance extensions of an endpoint.

This is greatly reduces boilerplate when strong patterns are established for an API like
authentication.

Here we show the benefits of customizing [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) member.

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
