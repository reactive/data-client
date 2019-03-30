# Resource

```typescript
import { Resource } from 'rest-hooks';

export class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
}
```

`Resource` is an abstract class that will help you define the data you are working with. There are
two sides to `Resource` - the static and instance side.

### Static

Is used to define how you retrieve and mutate data across the network. There are several
static methods that do this, but their ultimate purpose is to build [RequestShapes](./RequestShape.md), which
tell the [hooks](../useResource.md) how to process requests. Shapes are provided for the
common `REST` request types. However, it is encouraged to build your own or override the
provided ones to fit the needs of your API.

### Instance

Instances are mostly for you to define how you want to interact with your data. This means
you should start off by defining the fields you expect to see, and provide defaults in case
they are not sent for some reason. `Resource` also requires that you define a method to
get an entity's (entity is an instance of a Resource) unique identifier. (This is used for
book-keeping the normalized cache.) Make sure to mark all members as readonly as you
should be treating all your data as immutable (this library assumes that)!

You are encouraged to add your own member methods. Often times it is useful to provide
methods for computed values that are commonly used in your React components.

A final note: `Resource` provides a factory method called `fromJS()` that will be used
to construct instances. This is the only supported way of created `Resource`s so please
don't use constructors.

## Factory method

### static fromJS<T extends typeof Resource>(this: T, props: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T>

This is used to create instances of the `Resource` you defined. Will copy over props provided to
the instance in construction.

## Be sure to always provide:

### pk: () => string | number | null

PK stands for *primary key* and is intended to provide a standard means of retrieving
a key identifier for any `Resource`. In many cases there will simply be an 'id' field
member to return. In case of multicolumn you can simply join them together.

multi-column primary key:

```typescript
pk() {
  return [this.firstCol, this.secondCol, this.thirdCol].join(',');
}
```

While the `pk()` definition is key (pun intended) for making the normalized cache work;
it also becomes quite convenient for sending to a react element when iterating on
list results:

```tsx
//....
return (
  <div>
    {results.map(result => <TheThing key={result.pk()} thing={result} />)}
  </div>
)
```

### static urlRoot: string

Used to build url patterns in `url()` and `listUrl()`. Used as the default in
`getKey()` so typically you'll want this to be globally unique per Resource.

### static getKey()

This defines the key for the Resource itself, rather than an instance. As seen below, by default it
simply returns the urlRoot since this is typically globally unique. However if you want to share
urlRoot across different Resources, be sure to override this.

```typescript
/** Returns the globally unique identifier for this Resource */
static getKey<T extends typeof Resource>(this: T) {
  return this.urlRoot;
}
```

## Data methods

### static merge<T extends typeof Resource>(first: InstanceType<T>, second: InstanceType<T>) => InstanceType<T>

Takes only the defined (non-default) values of first and second and creates a new instance copying them over.
Second will override values of first.

### static hasDefined<T extends typeof Resource>(instance: InstanceType<T>, key: keyof InstanceType<T>) => boolean

Returns whether provided `key` is defined (non-default) in `instance`.

### static toObjectDefined<T extends typeof Resource>(instance: AbstractInstanceType<T>) => Partial<InstanceType<T>>

Returns an `Object` with only the defined (non-default) members of `instance`.

### static keysDefined<T extends typeof Resource>(instance: InstanceType<T>) => (keyof InstanceType<T>)[]

Returns an `Array` of all defined (non-default) keys of `instance`.

## Static network methods and properties

These are the basic building blocks used to compile the [Request shapes](../api/RequestShape.md) below.

### static url<T extends typeof Resource>(urlParams?: Partial<AbstractInstanceType\<T>>) => string

Computes the url based on the parameters. Default implementation follows `/urlRoot/[pk]` pattern.

### static listUrl<T extends typeof Resource>(searchParams?: Readonly<Record<string, string>>) => string

Computes url for retrieving list items. Defaults to urlRoot with `searchParams` being sent as GET
parameters.

### static fetch<T extends typeof Resource>(method: "get" | "post" | "put" | "patch" | "delete" | "options", url: string, body?: Partial<AbstractInstanceType\<T>>) => Promise\<any>

Performs the actual network fetch returning a promise that resolves to the network response or rejects
on network error. This can be useful to override to really customize your transport.

### static getEntitySchema() => [schema.Entity](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--)

Returns the [shape of the data](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#schema)
when requesting one resource at a time. Defaults to a plain object
containing the keys. This can be useful to override if your response is in a different form.

### static getRequestOptions() => [RequestOptions](../api/RequestShape.md#RequestOptions) | undefined

Returns the default request options for this resource. By default this returns undefined

## [Request shapes](../api/RequestShape.md)

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
shapes common in [REST](https://www.restapitutorial.com/) APIs. Feel free to customize or add
new shapes based to match your API.

### singleRequest(): ReadShape

A GET request using standard `url()` that receives a detail body.
Mostly useful with [useResource](../api/useResource.md)

### listRequest(): ReadShape

A GET request using `listUrl()` that receives a list of entities.
Mostly useful with [useResource](../api/useResource.md)

### createRequest(): MutateShape

A POST request sending a payload to `listUrl()` with empty params, and expecting a detail body response.
Mostly useful with [useFetcher](../api/useFetcher.md)

### updateRequest(): MutateShape

A PUT request sending a payload to a `url()` expecting a detail body response.
Mostly useful with [useFetcher](../api/useFetcher.md)

### partialUpdateRquest(): MutateShape

A PATCH request sending a partial payload to `url()` expecting a detail body response.
Mostly useful with [useFetcher](../api/useFetcher.md)

### deleteRequest(): DeleteShape

A DELETE request sent to `url()`
Mostly useful with [useFetcher](../api/useFetcher.md)
