---
title: Custom endpoints
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[Previously we saw how we could use](../README.md#use-the-resource)
the [useSuspense()](/docs/api/useSuspense) and [Controller.fetch()](/docs/api/Controller#fetch) hooks to read and mutate
data. The first argument of these hooks is known as a [Endpoint](api/Endpoint.md).
Endpoints are the minimal definition of instructions needed to tell Rest Hooks how to handle
those types of requests.

Resource comes with a [small handleful Endpoints](api/Resource.md#static-network-methods-and-properties)
for each of the typical [CRUD operations](https://restfulapi.net/http-methods/). This is often not enough.

:::caution

TypeScript does not infer `super` properly. When overriding you can either include
the schema, or explicitly specify the [return type](./rest-types) of the endpoint.

:::

## Overriding endpoints

By default the list() assumes an array of entities returned while detail() assumes
just the entity returned.

### Default schema

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

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

</TabItem>
<TabItem value="List">

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

</TabItem>
</Tabs>

### Example schema

However, often the data is not returned quite so simply. For instance, maybe it can be found in a 'data'
key of an object:

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

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

</TabItem>
<TabItem value="List">

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

</TabItem>
</Tabs>

### Resource definition

In this case, you'll need to override your detail() and list() definitions to reflect
the structure of your data. This is known as a 'schema' definition.

```typescript
import { Resource } from '@rest-hooks/rest';

export default class CommentResource extends Resource {
  static detail<T extends typeof Resource>(this: T) {
    return super.detail().extend({
      schema: { data: this },
    });
  }
  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { data: [this] },
    });
  }
}
```

Here we only overrode the 'schema' part of the [Endpoint](api/Endpoint.md) - taking advantage
of [super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super) to keep
the other pieces the same. See [pagination](./pagination), [nested resources](./nested-response)
and [mutation side-effects](./rpc) guide for more examples of custom schemas and overriding
endpoints.

## Additional endpoints

In many cases there are more means of interacting with a given resource than the basic CRUD
operations. Often this means a custom RPC call, or even a custom retrieval endpoint. We'll demonstrate
a few examples here, but be sure to learn more about [Endpoint](api/Endpoint.md)s to
define exactly what your endpoint needs.

### RPC

In this example, we have an RPC endpoint located at `/users/[id]/make_manager`. This endpoint
doesn't expect any body, but is a POST request. Because it is so similar to a [create()](api/Resource.md#create)
we'll be extended that schema definition.

```typescript
import { Resource } from '@rest-hooks/rest';

export default class UserResource extends Resource {
  static makeManager<T extends typeof Resource>(this: T) {
    const endpoint = this.create();
    return endpoint.extend({
      url({ id }: { id: number }) { return `/users/${id}/make_manager` },
      fetch({ id }: { id: number }) {
        return endpoint.fetch.call(this, { id });
      }
    });
  }
}
```

We customized the following:

- Custom type:
  - Params of { id: number }
  - No Body
- Custom url

### Custom GET

Normally we can look up user resources like any other - with their 'id'. However,
how do we get the currently logged in user? One way is to define a special url
just for retrieving the current user. In this case - `/current_user/`. Since there
is only one - we won't need to send any params.

```typescript
import { Resource } from '@rest-hooks/rest';

export default class UserResource extends Resource {
  /** Retrieves current logged in user */
  static current<T extends typeof Resource>(this: T) {
    const endpoint = this.detail();
    return endpoint.extend({
      fetch() { return endpoint.call(this); }
      url() { return '/current_user/' },
    })
  }
}
```

We customized the following:

- Custom type:
  - No params
- Custom url

#### Usage

```tsx
import { useSuspense } from 'rest-hooks';

import UserResource from 'resources/user';

export default function CurrentUserProfilePage() {
  const loggedInUser = useSuspense(UserResource.current());

  return <ProfileDetail user={loggedInUser} />;
}
```

### Custom List Endpoints

Sometimes we have endpoints that select particular results. We set the url
in our custom [Endpoint](api/Endpoint.md) function,
and ensure the data is normalized and typed
correctly via the [schema](api/Endpoint.md#schema) definition.

```typescript
import { Resource } from '@rest-hooks/rest';

export default class BirthdayResource extends BaseResource {
  readonly id: string | undefined = undefined;
  readonly name: string = '';
  readonly image: string = '';
  readonly source: string = '';
  readonly date: Date = new Date();

  pk() {
    return this.id;
  }

  static urlRoot = '/api/birthdays/';

  /** Lists all upcoming birthdays */
  static upcoming<T extends typeof Resource>(this: T) {
    const endpoint = this.list();
    return this.list().extend({
      fetch() { return endpoint.fetch.call(this); }
      url() { return '/current_user/' },
      schema: {
        withinSevenDays: [this],
        withinThirtyDays: [this],
      },
    });
  }
}
```

#### Usage

```tsx
import { useSuspense } from 'rest-hooks';

import BirthdayResource from 'resources/user';

export default function UpcomingBirthdays() {
  const { withinSevenDays, withinThirtyDays } = useSuspense(
    BirthdayResource.upcoming(),
    {},
  );

  return (
    <div>
      <h2>Next Seven</h2>
      <div>
        {withinSevenDays.map(birthday => (
          <Birthday key={birthday.pk()} birthday={birthday} />
        ))}
      </div>
      <h2>Next Thirty</h2>
      <div>
        {withinThirtyDays.map(birthday => (
          <Birthday key={birthday.pk()} birthday={birthday} />
        ))}
      </div>
    </div>
  );
}
```
