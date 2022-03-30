# normalizr
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/normalizr) [![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/normalizr.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/normalizr)

## Install

Install from the NPM repository using yarn or npm:

```shell
yarn add @rest-hooks/normalizr
```

```shell
npm install @rest-hooks/normalizr
```

## Motivation

Many APIs, public or not, return JSON data that has deeply nested objects. Using data in this kind of structure is often very difficult for JavaScript applications, especially those using [Flux](http://facebook.github.io/flux/) or [Redux](http://redux.js.org/).

## Solution

Normalizr is a small, but powerful utility for taking JSON with a schema definition and returning nested entities with their IDs, gathered in dictionaries.

## Documentation

* [Introduction](./docs/README.md)
  * [Build Files](./docs/README.md#build-files)
* [Quick Start](https://resthooks.io/docs/api/schema)
* [API](https://resthooks.io/docs/api/Entity)
  * [normalize](./docs/api.md#normalizedata-schema)
  * [denormalize](./docs/api.md#denormalizeinput-schema-entities)
  * [schema](https://resthooks.io/docs/api/schema)

## Examples

* [Normalizing GitHub Issues](/examples/normalizr-github)
* [Relational Data](/examples/normalizr-relationships)
* [Interactive Redux](/examples/normalizr-redux)

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
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    }
  ]
}
```

We have two nested entity types within our `article`: `users` and `comments`. Using various `schema`, we can normalize all three entity types down:

```js
import { normalize, schema, Entity } from '@rest-hooks/normalizr';

// Define a users schema
class User extends Entity {
  pk() { return this.id }
}

// Define your comments schema
class Comment extends Entity {
  pk() { return this.id }

  static schema = {
    commenter: User,
  }
}

// Define your article
class Article extends Entity {
  pk() { return this.id }

  static schema = {
  author: User,
  comments: [Comment]
  }
}

const normalizedData = normalize(originalData, Article);
```

Now, `normalizedData` will be:

```js
{
  result: "123",
  entities: {
    "Article": {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324" ]
      }
    },
    "User": {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    "Comment": {
      "324": { id: "324", "commenter": "2" }
    }
  }
}
```

## Dependencies

None.

## Credits

Normalizr was originally created by [Dan Abramov](http://github.com/gaearon) and inspired by a conversation with [Jing Chen](https://twitter.com/jingc). Since v3, it was completely rewritten and maintained by [Paul Armstrong](https://twitter.com/paularmstrong).
Since v4, it was largely rewritten and maintained by [Nathaniel Tucker](https://twitter.com/npinp).
It has also received much help, enthusiasm, and contributions from [community members](https://github.com/ntucker/normalizr/graphs/contributors).
