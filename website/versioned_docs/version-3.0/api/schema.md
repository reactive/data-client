---
title: Schema Quick Start
sidebar_label: Quick Start
---


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
    }
  ]
}
```

We have two nested entity types within our `article`: `users` and `comments`. Using various `schema`, we can normalize all three entity types down:

```typescript
import { normalize, schema, Entity } from '@rest-hooks/normalizr';

// Define a users schema
class User extends Entity {
  readonly id: string = '';
  readonly name: string = '';

  pk() { return this.id; }
}

// Define your comments schema
class Comment extends Entity {
  readonly id: string = '';
  readonly createdAt: Date = new Date(0);
  readonly commenter: User = User.fromJS({});

  pk() { return this.id; }

  static schema = {
    commenter: User,
    createdAt: Date,
  }
}

// Define your article
class Article extends Entity {
  readonly id: string = '';
  readonly title: string = '';
  readonly author: User = User.fromJS({});
  readonly comments: Comment[] = [];

  pk() { return this.id; }

  static schema = {
    author: User,
    comments: [Comment],
  }
}

const normalizedData = normalize(originalData, article);
```

Now, `normalizedData` will be:

```js
{
  result: "123",
  entities: {
    "articles": Article {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324" ]
      }
    },
    "users": {
      "1": User { "id": "1", "name": "Paul" },
      "2": User { "id": "2", "name": "Nicole" }
    },
    "comments": {
      "324": Comment {
        id: "324",
        "createdAt": Date(`May 29, 2013`),
        "commenter": "2"
      }
    }
  }
}
```
