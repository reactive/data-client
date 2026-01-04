# Normalizr Client

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/data-clientdata-clients)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/data-clientdata-clients?branch=master)
[![npm downloads](https://img.shields.io/npm/dt/@data-client/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/normalizr)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/normalizr?style=flat-square)](https://bundlephobia.com/result?p=@data-client/normalizr)
[![npm version](https://img.shields.io/npm/v/@data-client/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/data-clients/normalizr) [![npm downloads](https://img.shields.io/npm/dm/@data-client/normalizr.svg?style=flat-square)](https://www.npmjs.com/packagdata-clientoks/normalizr)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

Install from the NPM repository using yarn or npm:

```shell
yarn add @data-client/normalizr
```

```shell
npm install --save @data-client/normalizr
```

## Motivation

Many APIs, public or not, return JSON data that has deeply nested objects. Using data in this kind of structure is often very difficult for JavaScript applications, especially those using [Flux](http://facebook.github.io/flux/) or [Redux](http://redux.js.org/).

## Solution

Normalizr is a small, but powerful utility for taking JSON with a schema definition and returning nested entities with their IDs, gathered in dictionaries.

## Documentation

- [Introduction](https://dataclient.io/docs/concepts/normalization)
- [Quick Start](https://dataclient.io/rest/api/schema)
- [API](https://dataclient.io/rest/api/Entity)
  - [normalize](./docs/api.md#normalizedata-schema)
  - [denormalize](./docs/api.md#denormalizeinput-schema-entities)
  - [ImmutableJS](#immutablejs) - normalize/denormalize with ImmutableJS state
  - [schema](https://dataclient.io/rest/api/schema)

## Examples

- [Normalizing GitHub Issues](../../examples/normalizr-github)
- [Relational Data](../../examples/normalizr-relationships)
- [Interactive Redux](../../examples/normalizr-redux)
- [Benchmarks](../../examples/benchmark)
  - [Charts](https://reactive.github.io/data-client/dev/bench/)

## React Demos

- [Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx)
- [Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)
- [NextJS SSR Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)

## Quick Start

Consider a typical blog post. The API response for a single post might look something like this:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "createdAt": "2013-05-29T00:00:00-04:00",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    },
    {
      "id": "544",
      "createdAt": "2013-05-30T00:00:00-04:00",
      "commenter": {
        "id": "1",
        "name": "Paul"
      }
    }
  ]
}
```

We have two [nested](https://dataclient.io/rest/guides/relational-data) [entity](https://dataclient.io/rest/api/Entity) types within our `article`: `users` and `comments`. Using various [schema](https://dataclient.io/rest/api/Entity#schema), we can normalize all three entity types down:

```js
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from '@js-temporal/polyfill';

// Define a users schema
class User extends Entity {}

// Define your comments schema
class Comment extends Entity {
  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

// Define your article
class Article extends Entity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

### Normalize

```js
import { normalize } from '@data-client/normalizr';

const args = [{ id: '123' }];
const normalizedData = normalize(Article, originalData, args);
```

Now, `normalizedData` will create a single serializable source of truth for all entities:

```js
{
  result: "123",
  entities: {
    articles: {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324", "544" ]
      }
    },
    users: {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    comments: {
      "324": {
        id: "324",
        createdAt: "2013-05-29T00:00:00-04:00",
        commenter: "2"
      },
      "544": {
        id: "544",
        createdAt: "2013-05-30T00:00:00-04:00",
        commenter: "1"
      }
    }
  },
}
```

`normalizedData` can be placed in any flux store as the single source of truth for this data.

### Denormalize

Accessing the store can then be done using flux `selectors` by `denormalizing`:

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
```

Now, `denormalizedData` will instantiate the classes, ensuring all instances of the same member (like `Paul`) are referentially equal:

```js
Article {
  id: '123',
  title: 'My awesome blog post',
  author: User { id: '1', name: 'Paul' },
  comments: [
    Comment {
      id: '324',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '2', name: 'Nicole' }]
    },
    Comment {
      id: '544',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '1', name: 'Paul' }]
    }
  ]
}
```

### MemoCache

`MemoCache` is a singleton that can be used to maintain referential equality between calls as well
as potentially improved performance by 2000%. All three methods are memoized.

```js
import { MemoCache } from '@data-client/normalizr';

// you can construct a new memo anytime you want to reset the cache
const memo = new MemoCache();

const { data, paths } = memo.denormalize(schema, input, state.entities, args);

({ data, paths } = memo.query(schema, args, state));

function query(schema, args, state, key) {
  const queryKey = memo.buildQueryKey(
    schema,
    args,
    state,
    key,
  );
  const { data } = this.denormalize(schema, queryKey, state.entities, args);
  return typeof data === 'symbol' ? undefined : (data as any);
}
```

`memo.denormalize()` is just like denormalize() above but includes `paths` as part of the return value. `paths`
is an Array of paths of all entities included in the result.

`memo.query()` allows denormalizing without a normalized input. See [Queryable](https://dataclient.io/rest/api/schema#queryable) for more info.

`memo.buildQueryKey()` builds the input used to denormalize for `query()`. This is exposed
to allow greater flexibility in its usage.

## ImmutableJS

For applications using [ImmutableJS](https://immutable-js.com/) for state management, normalizr provides
dedicated functions via `@data-client/normalizr/imm` that work directly with Immutable.js data structures.

### Normalize into ImmutableJS

Use `normalize` from the imm entrypoint to normalize data directly into ImmutableJS Maps:

```js
import { normalize } from '@data-client/normalizr/imm';
import { fromJS } from 'immutable';

// Create initial ImmutableJS state
const initialState = {
  entities: fromJS({}),
  indexes: fromJS({}),
  entitiesMeta: fromJS({}),
};

const result = normalize(Article, responseData, args, initialState);

// result.entities is an ImmutableJS Map
result.entities.getIn(['Article', '123']);
```

### Denormalize from ImmutableJS

Use `denormalize` from the imm entrypoint for reading from Immutable state:

```js
import { denormalize } from '@data-client/normalizr/imm';

const article = denormalize(Article, '123', state.entities, args);
```

## Schemas

Available from [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

<table>
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

## Benchmarks

[Performance compared](https://github.com/reactive/data-client/blob/master/examples/benchmark/README.md) to normalizr package (higher is better):

|                     | no cache | with cache |
| ------------------- | -------- | ---------- |
| normalize (long)    | 120%     | 120%       |
| denormalize (long)  | 158%     | 1,250%     |
| denormalize (short) | 676%     | 2,990%     |

[View benchmark](https://github.com/reactive/data-client/blob/master/examples/benchmark)

## Credits

Normalizr Client is based on [Normalizr](https://github.com/paularmstrong/normalizr) - originally created by [Dan Abramov](http://github.com/gaearon) and inspired by a conversation with [Jing Chen](https://twitter.com/jingc). Since v3, it was completely rewritten and maintained by [Paul Armstrong](https://twitter.com/paularmstrong).

Normalizr Client was rewritten and maintained by Normalizr contributor [Nathaniel Tucker](https://twitter.com/npinp). It has also received much help, enthusiasm, and contributions from [community members](https://github.com/ntucker/normalizr/graphs/contributors).
