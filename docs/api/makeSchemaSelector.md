# makeSchemaSelector(shape: ReadShape, getResultList?: (resulst: any) => SchemaOf<typeof shape.schema>)

Builds a selector from the `schema` and `getUrl()` of a [ReadShape](./RequestShape.md).

```typescript
import { makeSchemaSelector, SchemaBase, AbstractInstanceType } from 'rest-hooks';

export default class MyBaseResource extends Resource {
  static singleRequest<T extends typeof Resource>(this: T) {
    const req = super.singleRequest();
    const schema: SchemaBase<AbstractInstanceType<T>> = { data: this.getEntitySchema() };
    return {
      ...req,
      schema,
      select: makeSchemaSelector({ schema, getUrl: req.getUrl }),
    };
  }
}
```

Our endpoint returns all its data in a 'data' field, so we reflected that in our custom schema
and used `makeSchemaSelector` to update our selector as well.
