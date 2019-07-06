---
title: Custom endpoints
id: version-1.6.9-endpoints
original_id: endpoints
---

[Previously we saw how we could use](../getting-started/usage#use-resource-docs-api-useresource)
the [useResource()](../api/useResource) and [useFetcher()](../api/useFetcher) hooks to read and mutate
data. The first argument of these hooks is known as a [RequestShape](../api/requestshape).
RequestShapes are the minimal definition of instructions needed to tell Rest Hooks how to handle
those types of requests.

Resource comes with a [small handleful RequestShapes](../api/resource#request-shapes-docs-api-requestshape)
for each of the typical [CRUD operations](https://restfulapi.net/http-methods/). This is often not enough.

## Overriding endpoints

By default the listRequest() assumes an array of entities returned while singleRequest() assumes
just the entity returned.

### Default schema

<!--DOCUSAURUS_CODE_TABS-->

<!--Single-->

```json
{
  "postId": 1,
  "id": 1,
  "name": "id labore ex et quam laborum",
  "email": "Eliseo@gardner.biz",
  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
}
```

`GET /comments/1`

<!--List-->

```json
[
  {
    "postId": 1,
    "id": 1,
    "name": "id labore ex et quam laborum",
    "email": "Eliseo@gardner.biz",
    "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
  },
  {
    "postId": 1,
    "id": 2,
    "name": "quo vero reiciendis velit similique earum",
    "email": "Jayne_Kuhic@sydney.com",
    "body": "est natus enim nihil est dolore omnis voluptatem numquam\net omnis occaecati quod ullam at\nvoluptatem error expedita pariatur\nnihil sint nostrum voluptatem reiciendis et"
  },
  {
    "postId": 1,
    "id": 3,
    "name": "odio adipisci rerum aut animi",
    "email": "Nikita@garfield.biz",
    "body": "quia molestiae reprehenderit quasi aspernatur\naut expedita occaecati aliquam eveniet laudantium\nomnis quibusdam delectus saepe quia accusamus maiores nam est\ncum et ducimus et vero voluptates excepturi deleniti ratione"
  }
]
```

`GET /comments`

<!--END_DOCUSAURUS_CODE_TABS-->

### Example schema

However, often the data is not returned quite so simply. For instance, maybe it can be found in a 'data'
key of an object:

<!--DOCUSAURUS_CODE_TABS-->

<!--Single-->

```json
{
  "data": {
    "postId": 1,
    "id": 1,
    "name": "id labore ex et quam laborum",
    "email": "Eliseo@gardner.biz",
    "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
  }
}
```

`GET /comments/1`

<!--List-->

```json
{
  "data": [
    {
      "postId": 1,
      "id": 1,
      "name": "id labore ex et quam laborum",
      "email": "Eliseo@gardner.biz",
      "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
    },
    {
      "postId": 1,
      "id": 2,
      "name": "quo vero reiciendis velit similique earum",
      "email": "Jayne_Kuhic@sydney.com",
      "body": "est natus enim nihil est dolore omnis voluptatem numquam\net omnis occaecati quod ullam at\nvoluptatem error expedita pariatur\nnihil sint nostrum voluptatem reiciendis et"
    },
    {
      "postId": 1,
      "id": 3,
      "name": "odio adipisci rerum aut animi",
      "email": "Nikita@garfield.biz",
      "body": "quia molestiae reprehenderit quasi aspernatur\naut expedita occaecati aliquam eveniet laudantium\nomnis quibusdam delectus saepe quia accusamus maiores nam est\ncum et ducimus et vero voluptates excepturi deleniti ratione"
    }
  ]
}
```

`GET /comments`

<!--END_DOCUSAURUS_CODE_TABS-->

### Resource definition

In this case, you'll need to override your singleRequest() and listRequest() definitions to reflect
the structure of your data. This is known as a 'schema' definition.

```typescript
import {
  Resource,
  ReadShape,
  SchemaBase,
  SchemaArray,
  AbstractInstanceType,
} from 'rest-hooks';

export default class CommentResource extends Resource {
  static singleRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaBase<AbstractInstanceType<T>>> {
    return {
      ...super.singleRequest(),
      schema: { data: this.getEntitySchema() },
    };
  }
  static listRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    return {
      ...super.listRequest(),
      schema: { data: [this.getEntitySchema()] },
    };
  }
}
```

Here we only overrode the 'schema' part of the [RequestShape](../api/requestshape) - taking advantage
of [super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super) to keep
the other pieces the same. See [pagination](./pagination) guide for more examples of custom schemas and overriding
endpoints.

## Additional endpoints

In many cases there are more means of interacting with a given resource than the basic CRUD
operations. Often this means a custom RPC call, or even a custom retrieval endpoint. We'll demonstrate
a few examples here, but be sure to learn more about [RequestShape](../api/requestshape)s to
define exactly what your endpoint needs.

### RPC

In this example, we have an RPC endpoint located at `/users/[id]/make_manager`. This endpoint
doesn't expect any body, but is a POST requeest. Because it is so similar to a [createRequest()](../api/resource#createrequest-mutateshape)
we'll be extended that schema definition.

```typescript
import {
  Resource,
  MutateShape,
  SchemaBase,
  AbstractInstanceType,
} from 'rest-hooks';

export default class UserResource extends Resource {
  static makeManagerRequest<T extends typeof Resource>(
    this: T,
  ): MutateShape<SchemaBase<AbstractInstanceType<T>>, { id: number }, {}> {
    return {
      ...this.createRequest(),
      getUrl({ id }: { id: number }) {
        return `/users/${id}/make_manager`;
      },
    };
  }
}
```

We customized the following:

- Custom type:
  - Params of { id: number }
  - Body (payload) of {}
- Custom url

### Custom GET

Normally we can look up user resources like any other - with their 'id'. However,
how do we get the currently logged in user? One way is to define a special url
just for retrieving the current user. In this case - `/current_user/`. Since there
is only one - we won't need to send any params.

```typescript
import {
  Resource,
  ReadShape,
  SchemaBase,
  AbstractInstanceType,
} from 'rest-hooks';

export default class UserResource extends Resource {
  /** Retrieves current logged in user */
  static currentRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaBase<AbstractInstanceType<T>>, {}> {
    return {
      ...this.singleRequest(),
      getUrl() {
        return '/current_user/';
      },
    };
  }
}
```

We customized the following:

- Custom type:
  - Params of {}
- Custom url

#### Usage

```tsx
import { useResource } from 'rest-hooks';

import UserResource from 'resources/user';

export default function CurrentUserProfilePage() {
  const loggedInUser = useResource(UserResource.currentRequest(), {});

  return <ProfileDetail user={loggedInUser} />
}
```
