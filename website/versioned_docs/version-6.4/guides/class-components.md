---
title: Usage with class components
---
import PkgTabs from '@site/src/components/PkgTabs';

Hooks are great, but many of us are working with existing codebases or libraries
with class based components. Some might be easy to migrate but others might be
more diffcult. Should this block you from adopting rest-hooks? Of course not!

Using the simple [hook-hoc](https://github.com/ntucker/hook-hoc) interop library
we can create Higher Order Components from hooks quite easily. This enables us
to easily replace any existing HOC with ease.

## Install [hook-hoc](https://github.com/ntucker/hook-hoc)

<PkgTabs pkgs="hook-hoc" />

## Use with class

```tsx
import withHook from 'hook-hoc';
import { useSuspense } from 'rest-hooks';

import UserResource from 'resources/user';

class Profile extends React.PureComponent<{
  id: number;
  user: UserResource;
  friends: UserResource[];
}> {
  //...
}

export default withHook(({ id }: { id: number }) => {
  const [user, friends] = useSuspense(
    [UserResource.get, { id }],
    [UserResource.getList, { friendid: id }],
  );
  return { user, friends };
})(Profile);
```

Here you can see the return value of the function you pass in gets injected into the props
of the component you wrap.

## Extracting the function

You might notice the function we pass to `withHook()` is a function that calls
hooks. That makes it a hook by definition. To make this detectable by the [rules of hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
and also potentially reusable, let's move it out to a named function:

```tsx
import withHook from 'hook-hoc';
import { useSuspense } from 'rest-hooks';

import UserResource from 'resources/user';

function useProfile({ id }: { id: number }) {
  const [user, friends] = useSuspense(
    [UserResource.get, { id }],
    [UserResource.getList, { friendid: id }],
  );
  return { user, friends };
}

class Profile extends React.PureComponent<{
  id: number;
  user: UserResource;
  friends: UserResource[];
}> {
  //...
}

export default withHook(useProfile)(Profile);
```

## Filters, debounce and more

Often times you'll be doing a bit more than just retrieving the data. We can
do all of that extra work in the hook we just created. Here we'll add some
client-side filtering as well as [debouncing](https://usehooks.com/useDebounce/) the requests themselves.

You can combine any hooks here - the sky's the limit.

```tsx
import { useSuspense } from 'rest-hooks';

import UserResource from 'resources/user';

function useProfile({ id }: { id: number }) {
  const debouncedId = useDebounce(id, 150);

  const [user, friends] = useSuspense(
    [UserResource.get, { id }],
    [UserResource.getList, { friendid: id }],
  );
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
