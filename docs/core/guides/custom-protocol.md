---
title: TypeScript Standard Endpoints
sidebar_label: Custom Protocol
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# TypeScript Standard Endpoints

[Endpoints](/rest/api/Endpoint) describe an asynchronous [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/). They hold its runtime behavior and, optionally, its types.

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
<summary><b>Example Usage</b></summary>

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

The endpoint holds _only_ the network definition, so any component can use it. Each piece of information you add to
it, such as TypeScript types, then helps every place that uses it: types catch typos and give autocomplete.

Define the interface once, and use it anywhere. This removes boilerplate and mistakes, and keeps data consistent across
the application.

## More than just a function

An [Endpoint](/rest/api/Endpoint) is also an object, so it can hold more information about the endpoint.

For example, [key()](/rest/api/Endpoint#key) serializes the endpoint and its parameters to a unique string. The cache
uses it to store responses and to know when parameters changed.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail [{"id":"1"}]
```

### Members

The optional second argument sets the endpoint's members. Use methods, not arrow functions, so
[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) can read the other members.

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

[extend()](/rest/api/Endpoint#extend) creates a new endpoint that inherits the members of the original, with correct
types. Use it to share patterns, such as authentication, across an API.

This example changes the [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) member:

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
