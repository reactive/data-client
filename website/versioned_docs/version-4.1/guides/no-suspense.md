---
title: Usage without Suspense
id: no-suspense
original_id: no-suspense
---

Some libraries you work with may take a [loading](https://ant.design/components/card/#components-card-demo-loading) or error state.
In these cases you might want a boolean `loading` instead of yielding to Suspense.

`useStatefulResource()` hook has been published under [@rest-hooks/legacy](https://www.npmjs.com/package/@rest-hooks/legacy)
for this purpose.

## Installation

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add @rest-hooks/legacy
```
<!--npm-->
```bash
npm install @rest-hooks/legacy
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Hook usage

#### `resources/ProfileResource.ts`

```typescript
export default class ProfileResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly img: string = '';
  readonly fullName: string = '';
  readonly bio: string = '';

  pk() {
    return this.id?.toString();
  }
  static urlRoot = '/profiles';
}
```

#### `ProfileList.tsx`

```tsx
import { useStatefulResource } from '@rest-hooks/legacy';
import { Skeleton, Card, Avatar } from 'antd';
import ProfileResource from 'resources/ProfileResource';

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

## API

```typescript
function useStatefulResource<Params extends Readonly<object>, S extends Schema>(fetchShape: ReadShape<S, Params>, params: Params | null): {
    data: DenormalizeNullable<S>;
    loading: boolean;
    error: (Params extends null ? undefined : Error) | undefined;
};
```
