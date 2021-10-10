# ![🛌🎣 Rest Hooks Legacy](https://raw.githubusercontent.com/coinbase/rest-hooks/master/packages/rest-hooks/rest_hooks_logo_and_text.svg?sanitize=true)
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/legacy?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/legacy)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[Rest Hooks](https://resthooks.io) without Suspense.

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/guides/no-suspense)** &nbsp;|&nbsp; [🏁Getting Started with Rest Hooks](https://resthooks.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Rest Hooks Demo](https://codesandbox.io/s/rest-hooks-hinux?fontsize=14&module=%2Fsrc%2Fpages%2FIssueList.tsx)

</div>

#### `resources/ProfileResource.ts`

```typescript
import { Resource } from '@rest-hooks/legacy';

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
