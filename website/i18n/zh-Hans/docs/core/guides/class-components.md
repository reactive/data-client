---
frameworks: [react]
title: 在类组件中使用 hook
---
import PkgTabs from '@site/src/components/PkgTabs';

类组件无法调用 hook。要在类组件中使用 Reactive Data Client，请用
[hook-hoc](https://github.com/ntucker/hook-hoc) 把 hook 包装成高阶组件。它也可以替换你现有的 HOC。

## 安装 [hook-hoc](https://github.com/ntucker/hook-hoc) {#install-hook-hoc}

<PkgTabs pkgs="hook-hoc" />

## 在类中使用 {#use-with-class}

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

`withHook()` 会把该函数的返回值作为 props 传给被包裹的组件。

## 提取函数 {#extracting-the-function}

传给 `withHook()` 的函数会调用 hook，所以它本身就是一个 hook。给它起一个以 `use` 开头的名字，这样
[hook 规则](https://www.npmjs.com/package/eslint-plugin-react-hooks) lint 规则就能检查它，你也可以复用
它：

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

## 过滤、防抖等 {#filters-debounce-and-more}

把其他工作也放进同一个 hook。这个示例在客户端进行过滤，并对请求进行
[防抖](../api/useDebounce.md)：

```tsx
import { useSuspense, useDebounce } from '@data-client/react';

import { UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const [debouncedId] = useDebounce(id, 150);

  const user = useSuspense(UserResource.get, { id: debouncedId });
  const friends = useSuspense(UserResource.getList, { friendid: debouncedId });
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
