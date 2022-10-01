---
title: Typing REST Endpoints
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In REST design, many operations can be performed on a given type of data.

Attaching these operations to the type via static methods allows

- A singular import for both class usage, typing, and endpoints
- Reducing code duplication by extracting common patterns into base classes

[Resource](api/Resource.md) provides one such pattern, which makes getting started
fast. However, even if the pattern generally matches your API design, there
are often special operations or one-off cases where additional endpoints must
be extended or added.

## TL;DR

### RestEndpoint

[RestEndpoint](/docs/api/types#restendpoint) type is provided to conveniently declare
[Resource](api/Resource.md) [Endpoint](api/Endpoint.md)s.

```typescript
RestEndpoint<
  F extends FetchFunction = RestFetch,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined
>
```

### Usage

Here's an example of each endpoint's return typed followed by usage. For
a full explanation, continue reading below.

```typescript
import { Resource, RestEndpoint, RestFetch } from '@rest-hooks/rest';

class MyResource extends Resource {
  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<RestFetch, SchemaList<AbstractInstanceType<T>>, undefined> {
    return super.list();
  }

  static create<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    RestFetch<Partial<AbstractInstanceType<T>>>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return super.create();
  }

  static filteredAndPaginatedList<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    RestFetch<[{ filterA: boolean; sortby: string }]>,
    { results: T[]; nextPage: string },
    undefined
  > {
    return super.list().extend({ schema: { results: [this], nextPage: '' } });
  }
}
```

```typescript
import MyResource from 'resources/MyResource';
import { useSuspense, useController } from 'rest-hooks';

const items = useSuspense(MyResource.list());
const { fetch } = useController();
const createMy = payload => fetch(MyResource.create(), payload);
const { results, nextPage } = useSuspense(
  MyResource.filteredAndPaginatedList(),
  { filterA: true, sortby: 'first' },
);
```

## Problem

To reduce code bloat, make development faster, reducing maintenance costs and reduce errors it is recommended
to share common patterns in parent classes, and only specify what is specific to a given
resource in that resource's class. Oftentimes this looks like simply its expected members
and a pk() definition (though if you use a common field for pk() - you can also pull that up).

[Resource](api/Resource.md) is an example attempt that is useful for many common REST patterns that
can be further extended and easily customized like so:

<Tabs
defaultValue="bloat"
values={[
{ label: 'Bloat', value: 'bloat' },
{ label: 'Gets reduced to', value: 'reduced' },
]}>
<TabItem value="bloat">

```typescript
class User {
  readonly id: string = '';
  readonly username: string = '';
  readonly createdAt: Date = new Date();

  pk() {
    return this.id;
  }

  static schema = {
    createdAt: Date,
  };

  static detail() {
    return new Endpoint(
      ({ id }: { id: string }) => fetch(`/user/${id}`).then(res => res.json()),
      { schema: User },
    );
  }

  static list() {
    return new Endpoint(() => fetch(`/user`).then(res => res.json()), {
      schema: [User],
    });
  }

  // ...even more endpoints for this Resource defined below
}

class Post extends Resource {
  readonly id: string = '';
  readonly title: string = '';
  readonly content: string = '';

  pk() {
    return this.id;
  }

  static detail() {
    return new Endpoint(
      ({ id }: { id: string }) => fetch(`/post/${id}`).then(res => res.json()),
      { schema: Post },
    );
  }

  static list() {
    return new Endpoint(() => fetch(`/post`).then(res => res.json()), {
      schema: [Post],
    });
  }

  // ...even more endpoints for this Resource defined below
}
```

</TabItem>
<TabItem value="reduced">

```typescript
class User extends Resource {
  readonly id: string = '';
  readonly username: string = '';
  readonly createdAt: Date = new Date();

  pk() {
    return this.id;
  }

  static schema = {
    createdAt: Date,
  };

  static urlRoot = '/user';
}

class Post extends Resource {
  readonly id: string = '';
  readonly title: string = '';
  readonly content: string = '';

  pk() {
    return this.id;
  }

  static urlRoot = '/post';
}
```

</TabItem>
</Tabs>

Even in this overly simplistic case we're more than halving the lines of code.
Once the complexities of the real world kick in, this improvement expands.

However, we now have a problem. Before we were explictily specifying the [Endpoint](api/Endpoint.md)s'
expected shape via the [schema](api/schema.md). Now it if we use the common methods like .detail()
we lose our typing information.

## Generics, static methods, and this

To explain the solution - generic `this` - let's simplify the example.

Here we'll define a static method that returns the type of the class - `Base`.

```typescript
class Base {
  static factory(): Base {
    const obj = new this();
    obj.extra = 5;
    return obj;
  }
}
```

If we inspect the runtime value, it says the type is `Base`.

```typescript
// type is Base
const obj = Base.factory();
// print Base
console.log(typeof obj);
```

Now we extend that class

```typescript
class Child extends Base {
  another = 5;
}
```

And call the same static method

```typescript
// type is Base
const obj = Child.factory();
// print Child
console.log(typeof obj);
```

TypeScript will implicitly type `obj` as `Base`, but at runtime, we can see it's really `Child`

## Solution: generics

Generics in TypeScript can be attached to parameters in any function and automatically inferred.
Since `this` is implicit, TypeScript allows you to explictly bind `this` if you want a method's
return type based on it:

```typescript
class Base {
  static factory<T extends Base>(this: T): T {
    const obj = new this();
    obj.extra = 5;
    return obj;
  }
}
```

```typescript
// type is Child
const obj = Child.factory();
// print Child
console.log(typeof obj);
```

Now when we call the method defined in `Base` on any descendant, it is typed appropriately!

## A limitation

While generic `this` is powerful in allowing correct typing even for inherited classes, it
has one annoying bug: `super` calls incorrectly resolve to the constraint, rather than the generic.

```typescript
class Child extends Base {
  extra: number = 0;

  static factory<T extends Base>(this: T): T {
    const obj = super.factory();
    obj.extra = 2;
    // @ts-expect-error - typescript says obj is not compatible with T
    return obj;
  }
}
```

### Workaround

`any` is mostly to be avoided, but since we are careful to type our return
type correctly in the method, we can be confident the rest of our code will
still be protected.

```typescript
class Child extends Base {
  extra: number = 0;

  static factory<T extends Base>(this: T): T {
    const obj = super.factory();
    obj.extra = 2;
    return obj as any;
  }
}
```

This is only needed if we are setting the type directly from the super call.
We'll see below we only need to do this when we retain the schema from the super call.
This is also not necessary if `this.method()` is called as this bug _only_ affects `super`

## As Resource

Applying this to our original example, we get something along the lines of:

```typescript
class Resource {
  static detail<T extends typeof Resource>(this: T) {
    return new Endpoint(
      props => fetch(this.url(props)).then(res => res.json()),
      { schema: this },
    );
  }

  static list<T extends typeof Resource>(this: T) {
    return new Endpoint(
      props => fetch(this.listUrl(props)).then(res => res.json()),
      { schema: [this] },
    );
  }
}
```

## Extending and adding endpoints

This means any time we define our own [custom endpoints](./extending-endpoints) we should
be sure to include generics so the types are alwalys correct.

For instance, we can change the expected response of the API to have the resource
inside the 'data' attribute:

```typescript
class User extends Resource {
  static detail<T extends typeof Resource>(this: T) {
    return super.detail().extend({ schema: { data: this } });
  }
}
```

If we were to explicitly type thing, we could use `RestEndpoint`

<Tabs
defaultValue="Schema"
values={[
{ label: 'Schema', value: 'Schema' },
{ label: 'Parameters', value: 'Parameters' },
{ label: 'Mutate', value: 'Mutate' },
{ label: 'Payload/Body', value: 'Payload/Body' },
]}>
<TabItem value="Schema">

```typescript
// typeof result is { data: User }
const result = useSuspense(User.detail(), { id });
```

```typescript
import { RestEndpoint, RestFetch, Resource } from '@rest-hooks/rest';

class User extends Resource {
  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<RestFetch, { data: T }, undefined> {
    return super.detail().extend({ schema: { data: this } });
  }
}

const { data: user } = useSuspense(User.detail(), { id: '5' });
```

</TabItem>
<TabItem value="Parameters">

```typescript
// typeof id is string
const result = useSuspense(User.detail(), { id });
```

```typescript
import { RestEndpoint, RestFetch, Resource } from '@rest-hooks/rest';

class User extends Resource {
  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    RestFetch<[{ id: string }]>,
    SchemaDetail<AbstractInstanceType<T>>,
    undefined
  > {
    // super.detail() resolves the Schema to be based on `typeof Resource`, rather than `T`
    // which makes it incompatible with the return type correctly specified.
    return super.detail() as any;
  }
}

const { data: user } = useSuspense(User.detail(), { id: '5' });
```

</TabItem>
<TabItem value="Mutate">

```typescript
// works
const { fetch } = useController();
const updateUser = (id, payload) => fetch(User.update(), { id }, payload);
// typeerror - protected against mutable operations
const user = useSuspense(User.update());
```

```typescript
import { RestEndpoint, RestFetch, Resource } from '@rest-hooks/rest';

class User extends Resource {
  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<RestFetch, T, true> {
    // super.update() resolves the Schema to be based on `typeof Resource`, rather than `T`
    // which makes it incompatible with the return type correctly specified.
    return super.update() as any;
  }
}

const { data: user } = useSuspense(User.detail(), { id: '5' });
```

</TabItem>
<TabItem value="Payload/Body">

```typescript
const { fetch } = useController();

const handleClick = useCallback(() => {
  // works
  const response = await fetch(User.update(), { id }, { username: 'bob' });
  // typeerror
  const failed = await fetch(User.update(), { id }, { username: 5 });
  // typeerror
  const failed = await fetch(User.update(), { id }, { usernme: 'bob' });
}, [fetch]);
```

```typescript
import { RestEndpoint, RestFetch, Resource } from '@rest-hooks/rest';

class User extends Resource {
  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<RestFetch<[object, { username: string }]>, T, true> {
    // super.update() resolves the Schema to be based on `typeof Resource`, rather than `T`
    // which makes it incompatible with the return type correctly specified.
    return super.update() as any;
  }
}

const { data: user } = useSuspense(User.detail(), { id: '5' });
```

</TabItem>
</Tabs>

## Typing rules of thumb

Generally you want to type return values as specific as possible, but accept
function arguments as loose as possible (like in hooks). To follow this principal:

- [RestEndpoint](/docs/api/types#restendpoint) for endpoints in [Resource](api/Resource.md)s
- [EndpointInstance](/docs/api/types#endpointinstance) for anything that uses the [Endpoint](api/Endpoint.md) class.
- [EndpointInterface](/docs/api/types#endpointinterface) for any hook arguments
