---
title: useDLE() - [D]ata [L]oading [E]rror
sidebar_label: useDLE()
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';

<head>
  <title>useDLE() - [D]ata [L]oading [E]rror React State</title>
</head>

import PkgTabs from '@site/src/components/PkgTabs';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

High performance async data rendering without overfetching. With fetch meta data.

In case you cannot use [suspense](../getting-started/data-dependency.md#async-fallbacks), useDLE() is just like [useSuspense()](./useSuspense.md) but returns [D]ata [L]oading [E]rror values.

## Usage

<HooksPlayground fixtures={listFixtures} row>

```typescript title="ProfileResource" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Profile';
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList"
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList(): JSX.Element {
  const { data, loading, error } = useDLE(ProfileResource.getList);
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <>loading...</>;
  return (
    <div>
      {data.map(profile => (
        <div className="listItem" key={profile.pk()}>
          <Avatar src={profile.avatar} />
          <div>
            <h4>{profile.fullName}</h4>
            <p>{profile.bio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
render(<ProfileList />);
```

</HooksPlayground>

## Behavior

| Expiry Status | Fetch           | Data         | Loading | Error             | Conditions                                                                                                                                                                          |
| ------------- | --------------- | ------------ | ------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | `undefined`  | true    | false             | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | yes<sup>1</sup> | denormalized | false   | false             | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                                 |
| Valid         | no              | denormalized | false   | maybe<sup>2</sup> | fetch completion                                                                                                                                                                    |
|               | no              | `undefined`  | false   | false             | `null` used as second argument                                                                                                                                                      |

:::note

1. Identical fetches are automatically deduplicated
2. [Hard errors](../concepts/expiry-policy.md#error-policy) to be [caught](../getting-started/data-dependency#async-fallbacks) by [Error Boundaries](./AsyncBoundary.md)

:::

<ConditionalDependencies hook="useDLE" />

## Types

<GenericsTabs>

```typescript
function useDLE(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): {
  data: Denormalize<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

```typescript
function useDLE<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): {
  data: DenormalizeNullable<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

</GenericsTabs>
