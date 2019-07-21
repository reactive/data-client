---
title: Usage without Suspense
---

Some libraries you work with may take a [loading](https://ant.design/components/card/#components-card-demo-loading) or error state.
In these cases you might want a boolean `loading` instead of yielding to Suspense.

In any case, here's a sample hook you can adapt to use that information in any
way you please.

## Sample Hook

#### `useStatefulResource.tsx`

```typescript
import { useRetrieve, useCache, useError, Schema, ReadShape } from 'rest-hooks';

/** If the invalidIfStale option is set we suspend if resource has expired */
function hasUsableData<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object> | void
>(
  resource: RequestResource<ReadShape<S, Params, Body>> | null,
  fetchShape: ReadShape<S, Params, Body>,
) {
  return !(
    (fetchShape.options && fetchShape.options.invalidIfStale) ||
    !resource
  );
}

/** Ensure a resource is available; loading and error returned explicitly. */
function useStatefulResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null) {
  let maybePromise = useRetrieve(fetchShape, params);
  const resource = useCache(fetchShape, params);

  const loading =
    !hasUsableData(resource, fetchShape) &&
    maybePromise &&
    typeof maybePromise.then === 'function';

  let error = useError(fetchShape, params, resource);

  return {
    data: resource as NonNullable<typeof resource>,
    loading,
    error,
  };
}
```

## Hook usage

#### `resources/ProfileResource.ts`

```typescript
export default class ProfileResource extends Resource {
  readonly id: number | null = null;
  readonly img: string = '';
  readonly fullName: string = '';
  readonly bio: string = '';

  pk() {
    return this.id;
  }
  static urlRoot = '/profiles';
}
```

#### `ProfileList.tsx`

```tsx
import { Skeleton, Card, Avatar } from 'antd';
import ProfileResource from 'resources/ProfileResource';

import useStatefulResource from './useStatefulResource';

const { Meta } = Card;

function ProfileList() {
  const { data, loading, error } = useStatefulResource(
    ProfileResource.detailShape(),
    {},
  );
  if (error) return <div>Error {error.status}</div>
  return (
    <Card style={{ width: 300, marginTop: 16 }} loading={loading}>
      <Meta
        avatar={
          <Avatar src={data.img} />
        }
        title={data.fullName}
        description={data.bio}
      />
    </Card>
  );
}
```
