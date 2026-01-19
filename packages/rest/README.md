# TypeScript HTTP definitions

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/rest.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/rest)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/rest?style=flat-square)](https://bundlephobia.com/result?p=@data-client/rest)
[![npm version](https://img.shields.io/npm/v/@data-client/rest.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/rest)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Codegen GPT](https://img.shields.io/badge/chatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white)](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

<div align="center">

**[📖Read The Docs](https://dataclient.io/rest)** &nbsp;|&nbsp; [🤖Codegen](https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen) &nbsp;|&nbsp; [🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fresources%2FTodoResource.ts) &nbsp;|&nbsp; [🎮Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fresources%2FIssue.tsx)

</div>

## RestEndpoint

Simplify TypeScript fetch functions with [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint)

```typescript
const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

[RestEndpoint](https://dataclient.io/rest/api/RestEndpoint) infers [path-to-regexp](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp)
argument types, enabling enforcement of function calls

```typescript
// signature requires id!
const todo = await getTodo({ id: 5 });
```

It automatically handles REST concepts like JSON serialization, consolidated error handling and more.

## Resources

Simplify related CRUD endpoints with [Resources](https://dataclient.io/rest/api/resource)

[Resources](https://dataclient.io/rest/api/resource) are a collection of `methods` for a given `data model`.

[Entities](https://dataclient.io/rest/api/Entity) and [Schemas](https://dataclient.io/concepts/normalization) declaratively define the _data model_.
[RestEndpoints](https://dataclient.io/rest/api/RestEndpoint) are the [_methods_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) on
that data.

```typescript
class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number },
  schema: Todo,
  paginationField: 'page',
});
```

One Resource defines [seven endpoints](https://dataclient.io/rest/api/resource#members):

```typescript
// GET https://jsonplaceholder.typicode.com/todos/5
let todo5 = await TodoResource.get({ id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todoList = await TodoResource.getList();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const userOneTodos = await TodoResource.getList({ userId: 1 });

// POST https://jsonplaceholder.typicode.com/todos
const newTodo = await TodoResource.getList.push({ title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
const newUserOneTodo = await TodoResource.getList.push(
  { userId: 1 },
  { title: 'my todo' },
);

// GET https://jsonplaceholder.typicode.com/todos?userId=1&page=2
const nextPageOfTodos = await TodoResource.getList.getPage({
  userId: 1,
  page: 2,
});

// PUT https://jsonplaceholder.typicode.com/todos/5
todo5 = await TodoResource.update({ id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
todo5 = await TodoResource.partialUpdate({ id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
await TodoResource.delete({ id: 5 });
```

## Free React Integration

No need for any custom hooks. All endpoints are 100% compatible with [Reactive Data Client](https://dataclient.io)

### [Rendering](https://dataclient.io/docs/getting-started/data-dependency)

```typescript
const todo = useSuspense(TodoResource.get, { id: 5 });
const todoList = useSuspense(TodoResource.getList);
```

### [Mutations](https://dataclient.io/docs/getting-started/mutations)

```typescript
const ctrl = useController();
const updateTodo = data => ctrl.fetch(TodoResource.update, { id }, data);
const partialUpdateTodo = data =>
  ctrl.fetch(TodoResource.partialUpdate, { id }, data);
const addTodoToEnd = data => ctrl.fetch(TodoResource.getList.push, data);
const addTodoToBeginning = data =>
  ctrl.fetch(TodoResource.getList.unshift, data);
const deleteTodo = data => ctrl.fetch(TodoResource.delete, { id });
```

### [Programmatic queries](https://dataclient.io/rest/api/Query)

```tsx
const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  entries => entries.filter(todo => !todo.completed).length,
);

const allRemainingTodos = useQuery(queryRemainingTodos);
const firstUserRemainingTodos = useQuery(queryRemainingTodos, { userId: 1 });
```

```typescript
const groupTodoByUser = new Query(
  TodoResource.getList.schema,
  todos => Object.groupBy(todos, todo => todo.userId),
);
const todosByUser = useQuery(groupTodoByUser);
```

### TypeScript requirements

TypeScript is optional, but will only work with 4.0 or above. 4.1 is needed for stronger types as it
supports inferring argument types from the path templates.

### Prior Art

- [Backbone Model](https://backbonejs.org/#Model)
- [ImmutableJS Record](https://immutable-js.github.io/immutable-js/docs/#/Record)

## API

#### Networking definition

- [Endpoints](https://dataclient.io/rest/api/Endpoint): [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint)
- [Resources](https://dataclient.io/docs/getting-started/resource): [resource()](https://dataclient.io/rest/api/resource), [hookifyResource()](https://dataclient.io/rest/api/hookifyResource)

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
<td><a href="https://dataclient.io/rest/api/Entity">Entity</a>, <a href="https://dataclient.io/rest/api/EntityMixin">EntityMixin</a></td>
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
<td align="center"> </td>
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
