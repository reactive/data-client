---
title: useDLE()
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

<head>
  <title>useDLE() - [D]ata [L]oading [E]rror: Stateful Data Fetching</title>
</head>

import PkgTabs from '@site/src/components/PkgTabs';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

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

In case you cannot use [suspense](../getting-started/data-dependency.md#async-fallbacks), useDLE() is just like [useSuspense()](./useSuspense.md) but returns [D]ata [L]oading [E]rror values.

## Hook usage

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/profiles'}),
args: [],
response: [{ id: '1', fullName: 'Einstein', bio: 'Smart physicist' },{ id: '2', fullName: 'Elon Musk', bio: 'CEO of Tesla, SpaceX and owner of Twitter' }],
delay: 150,
},
]}>

```typescript title="api/Profile.ts" collapsed
import { Entity, createResource } from '@rest-hooks/rest';

export class Profile extends Entity {
  readonly id: number | undefined = undefined;
  readonly img: string = '';
  readonly fullName: string = '';
  readonly bio: string = '';

  pk() {
    return this.id?.toString();
  }
}

export const ProfileResource = createResource({
  path: '/profiles/:id',
  schema: Profile,
});
```

```tsx title="ProfileList.tsx"
import { useDLE } from 'rest-hooks';
import { ProfileResource } from './api/Profile';

function ProfileList(): JSX.Element {
  const { data, loading, error } = useDLE(ProfileResource.getList);
  if (error) return <div>Error {error.status}</div>;
  if (loading || !data) return <>loading...</>;
  return (
    <div>
      {data.map(profile => (
        <div key={profile.pk()}>
          <h4>{profile.fullName}</h4>
          <p>{profile.bio}</p>
        </div>
      ))}
    </div>
  );
}
render(<ProfileList />);
```

</HooksPlayground>

<ConditionalDependencies hook="useDLE" />
