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

## Be sure to always provide:

### pk: () => string | number | null

Typically just return the id field. In case of multicolumn you can simply join them together.

multi-column primary key:

```typescript
pk() {
  return [this.firstCol, this.secondCol, this.thirdCol].join(',');
}
```

### static urlRoot: string

Must be globally unique - even if you don't use it in url().

## Provided and overridable methods

### static url<T extends typeof Resource>(urlParams?: Partial<AbstractInstanceType\<T>>) => string

Computes the url based on the parameters. Default implementation follows `/urlRoot/[pk]` pattern.

### static listUrl<T extends typeof Resource>(searchParams?: object) => string

Computes url for retrieving list items. Defaults to urlRoot with `searchParams` being sent as GET
parameters.

### static fetch<T extends typeof Resource>(method: "get" | "post" | "put" | "patch" | "delete", url: string, body?: Partial<AbstractInstanceType\<T>>) => Promise\<any>

Performs the actual network fetch returning a promise that resolves to the network response or rejects
on network error. This can be useful to override to really customize your transport.

### static getSchema() => [schema.Entity](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#entitykey-definition---options--)

Returns the [shape of the data](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#schema)
when requesting one resource at a time. Defaults to a plain object
containing the keys. This can be useful to override if your response is in a different form.

## [Request shapes](../api/RequestShape.md)

### singleRequest()

A GET request using standard `url()` that receives a detail body.
Mostly useful with [useResource](../api/useResource.md)

### listRequest()

A GET request using `listUrl()` that receives a list of entities.
Mostly useful with [useResource](../api/useResource.md)

### createRequest()

A POST request sending a payload to `listUrl()` with empty params, and expecting a detail body response.
Mostly useful with [useDispatch](../api/useDispatch.md)

### updateRequest()

A PUT request sending a payload to a `url()` expecting a detail body response.
Mostly useful with [useDispatch](../api/useDispatch.md)

### partialUpdateRquest()

A PATCH request sending a partial payload to `url()` expecting a detail body response.
Mostly useful with [useDispatch](../api/useDispatch.md)

### deleteRequest()

A DELETE request sent to `url()`
Mostly useful with [useDispatch](../api/useDispatch.md)
