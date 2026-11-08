---
frameworks: [react]
title: Using hooks with class components
---
import PkgTabs from '@site/src/components/PkgTabs';

Class components cannot call hooks. To use Reactive Data Client with them, wrap hooks in a Higher Order Component
with [hook-hoc](https://github.com/ntucker/hook-hoc). It can also replace your existing HOCs.

## Install [hook-hoc](https://github.com/ntucker/hook-hoc)

<PkgTabs pkgs="hook-hoc" />

## Use with class

```tsx
import { PureComponent } from 'react';
import withHook from 'hook-hoc';
import { useSuspense } from '@data-client/react';

import { User, UserResource } from './resources/User';

class Profile extends PureComponent<{
  id: number;
  user: User;
  friends: User[];
}> {
  //...
}

export default withHook(({ id }: { id: number }) => {
  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  return { user, friends };
})(Profile);
```

`withHook()` passes the function's return value to the wrapped component as props.

## Extracting the function

The function passed to `withHook()` calls hooks, so it is a hook. Give it a `use` name so the
[rules of hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) lint rule can check it, and so you can reuse
it:

```tsx
import { PureComponent } from 'react';
import withHook from 'hook-hoc';
import { useSuspense } from '@data-client/react';

import { User, UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  return { user, friends };
}

class Profile extends PureComponent<{
  id: number;
  user: User;
  friends: User[];
}> {
  //...
}

export default withHook(useProfile)(Profile);
```

## Filters, debounce and more

Put any other work in the same hook. This example filters on the client and
[debounces](../api/useDebounce.md) the requests:

```tsx
import { useSuspense, useDebounce } from '@data-client/react';

import { UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const debouncedId = useDebounce(id, 150);

  const user = useSuspense(UserResource.get, { id: debouncedId });
  const friends = useSuspense(UserResource.getList, { friendid: debouncedId });
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
