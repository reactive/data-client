---
title: Usage without Suspense
id: version-3.0-no-suspense
original_id: no-suspense
---

Some libraries you work with may take a [loading](https://ant.design/components/card/#components-card-demo-loading) or error state.
In these cases you might want a boolean `loading` instead of yielding to Suspense.

In any case, here's a sample hook you can adapt to use that information in any
way you please.

## Sample Hook

#### `useStatefulResource.tsx`

```typescript
import { useContext} from 'react';
import { useRetrieve, useError, Schema, ReadShape, FetchShape, useDenormalized, __INTERNAL__ } from 'rest-hooks';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData(
  cacheReady: boolean,
  fetchShape: Pick<FetchShape<any>, 'options'>,
) {
  return !(
    (fetchShape.options && fetchShape.options.invalidIfStale) ||
    !cacheReady
  );
}


/** Ensure a resource is available; loading and error returned explicitly. */
export function useStatefulResource<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  let maybePromise = useRetrieve(fetchShape, params);
  const state = useContext(__INTERNAL__.StateContext);
  const [denormalized, ready] = useDenormalized(fetchShape, params, state);

  const loading =
    !hasUsableData(ready, fetchShape) &&
    maybePromise &&
    typeof maybePromise.then === 'function';

  let error = useError(fetchShape, params, ready);

  return {
    data: denormalized,
    loading,
    error,
  };
}
```

## Hook usage

#### `resources/ProfileResource.ts`

```typescript
export default class ProfileResource extends Resource {
  readonly id: number | undefined = undefined;
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
