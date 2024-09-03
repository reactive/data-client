# TypeScript Standard Endpoints
[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/endpoint.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/endpoint)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/endpoint?style=flat-square)](https://bundlephobia.com/result?p=@data-client/endpoint)
[![npm version](https://img.shields.io/npm/v/@data-client/endpoint.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/endpoint)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Declarative, strongly typed, reusable network definitions for networking libraries.

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs/guides/custom-protocol)**

</div>

## Usage

### 1) Take any class and async functions

```typescript
export class Todo {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}

export const getTodo = (id: string) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res => res.json());

export const getTodoList = () =>
  fetch('https://jsonplaceholder.typicode.com/todos').then(res => res.json());

export const updateTodo = (id: string, body: Partial<Todo>) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }).then(res => res.json());
```

### 2) Turn them into Resources

```typescript
import { schema, Endpoint } from '@data-client/endpoint';
import { Todo, getTodoList, updateTodo } from './existing';

export const TodoEntity = schema.Entity(Todo, { key: 'Todo' });

export const TodoResource = {
  get: new Endpoint(getTodo, {
    schema: TodoEntity,
  }),
  getList: new Endpoint(getTodoList, {
    schema: [TodoEntity],
  }),
  update: new Endpoint(updateTodo, {
    schema: TodoEntity,
    sideEffect: true,
  }),
};
```

### 3) Reuse with different hooks

```tsx
import { useSuspense, useController } from '@data-client/react';

function TodoEdit() {
  const todo = useSuspense(TodoResource.get, '5');
  const ctrl = useController();
  const updateTodo = (data) => ctrl.fetch(TodoResource.update, id, data);

  return <TodoForm todo={todo} onSubmit={updateTodo} />
}
```

### 4) Or call directly in node

```typescript
const todo = await TodoResource.get('5')
console.log(todo);
```

## Why

There is a distinction between

- What are networking API is
  - How to make a request, expected response fields, etc.
- How it is used
  - Binding data, polling, triggering imperative fetch, etc.

Thus, there are many benefits to creating a distinct seperation of concerns between
these two concepts.

With `TypeScript Standard Endpoints`, we define a standard for declaring in
TypeScript the definition of a networking API.

- Allows API authors to publish npm packages containing their API interfaces
- Definitions can be consumed by any supporting library, allowing easy consumption across libraries like Vue, React, Angular
- Writing codegen pipelines becomes much easier as the output is minimal
- Product developers can use the definitions in a multitude of contexts where behaviors vary
- Product developers can easily share code across platforms with distinct behaviors needs like React Native and React Web

### What's in an Endpoint

- A function that resolves the results
- A function to uniquely store those results
- Optional: information about how to store the data in a normalized cache
- Optional: whether the request could have side effects - to prevent repeat calls

## API

`@data-client/endpoint` defines a standard `interface`

```typescript
interface EndpointInterface {
    (params?: any, body?: any): Promise<any>;
    key(parmas?: any): string;
    schema?: Readonly<S>;
    sideEffects?: true;
    // other optionals like 'optimistic'
}
```

as well as a helper `class` to make construction easier.

```typescript
class Endpoint<F extends () => Promise<any>> {
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  fetch: F;

  extend(options: EndpointOptions): Endpoint;
}

export interface EndpointOptions extends EndpointExtraOptions {
  key?: (params: any) => string;
  sideEffect?: true | undefined;
  schema?: Schema;
}
```

### [EndpointOptions](https://dataclient.io/rest/api/Endpoint#endpointextraoptions)

#### key: (params) => string

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.fetch.name} ${JSON.stringify(params)}`
```

### sideEffect: true | undefined

Disallows usage in hooks like `useSuspense()` since they might call fetch
an unpredictable number of times. Use this for APIs with mutation side-effects like update, create, deletes.

Defaults to undefined meaning no side effects.

### schema: Schema

Declarative definition of where `Entities` appear in the fetch response.

Not providing this option means no entities will be extracted.

```tsx
import { Entity } from '@data-client/normalizr';
import { Endpoint } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new Endpoint(
    ({ id }) ⇒ fetch(`/users/${id}`),
    { schema: User }
);
```

### [Endpoint](https://dataclient.io/rest/api/Endpoint)

#### extend(EndpointOptions): Endpoint

Can be used to further customize the endpoint definition

```typescript
const UserDetail = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`));


const UserDetailNormalized = UserDetail.extend({ schema: User });
```

## API

Networking definition: [Endpoints](https://dataclient.io/rest/api/Endpoint)

<table>
<caption>
<a href="https://dataclient.io/docs/concepts/normalization">Data model</a>
</caption>
<thead>
<tr>
<th>Data Type</th>
<th>Mutable</th>
<th>Schema</th>
<th>Description</th>
<th><a href="https://dataclient.io/rest/api/schema#queryable">Queryable</a></th>
</tr>
</thead>
<tbody><tr>
<td rowSpan="4"><a href="https://en.wikipedia.org/wiki/Object_(computer_science)">Object</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Entity">Entity</a>, <a href="https://dataclient.io/rest/api/schema.Entity">schema.Entity</a> mixin</td>
<td>single <em>unique</em> object</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Union">Union(Entity)</a></td>
<td>polymorphic objects (<code>A | B</code>)</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Object">Object</a></td>
<td>statically known keys</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Invalidate">Invalidate(Entity)</a></td>
<td><a href="https://dataclient.io/docs/concepts/expiry-policy#invalidate-entity">delete an entity</a></td>
<td align="center">🛑</td>
</tr>
<tr>
<td rowSpan="3"><a href="https://en.wikipedia.org/wiki/List_(abstract_data_type)">List</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Array)</a></td>
<td>growable lists</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Array">Array</a></td>
<td>immutable lists</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/All">All</a></td>
<td>list of all entities of a kind</td>
<td align="center">✅</td>
</tr>
<tr>
<td rowSpan="2"><a href="https://en.wikipedia.org/wiki/Associative_array">Map</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Values)</a></td>
<td>growable maps</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Values">Values</a></td>
<td>immutable maps</td>
<td align="center">🛑</td>
</tr>
<tr>
<td>any</td>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Query">Query(Queryable)</a></td>
<td>memoized custom transforms</td>
<td align="center">✅</td>
</tr>
</tbody></table>