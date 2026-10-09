---
frameworks: [react]
title: 在类组件中使用 hook
---
import PkgTabs from '@site/src/components/PkgTabs';

hook 很棒，但我们中的许多人都在维护使用类组件的现有代码库或库。
其中有些可能很容易迁移，有些则可能比较困难。这会妨碍你采用 Reactive Data Client 吗？当然不会！

借助简单的 [hook-hoc](https://github.com/ntucker/hook-hoc) 互操作库，
我们可以很轻松地基于 hook 创建高阶组件。这使我们能够
轻松替换任何现有的 HOC。

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

可以看到，你传入的函数的返回值会被注入到被包裹组件的 props
中。

## 提取函数 {#extracting-the-function}

你可能会注意到，我们传给 `withHook()` 的函数会调用
hook。按照定义，它本身就是一个 hook。为了让 [hook 规则](https://www.npmjs.com/package/eslint-plugin-react-hooks)能够检测到它，
同时也便于复用，我们把它提取为一个具名函数：

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

很多时候，你要做的不仅仅是获取数据。我们可以
在刚刚创建的 hook 中完成所有这些额外工作。这里我们会添加一些
客户端过滤，并对请求本身进行[防抖](https://usehooks.com/useDebounce/)。

你可以在这里组合任意 hook——一切皆有可能。

```tsx
import { useSuspense, useDebounce } from '@data-client/react';

import { UserResource } from './resources/User';

function useProfile({ id }: { id: number }) {
  const debouncedId = useDebounce(id, 150);

  const user = useSuspense(UserResource.get, { id });
  const friends = useSuspense(UserResource.getList, { friendid: id });
  const realFriends = friends.filter(friend => friend.isReal);

  return { user, friends: realFriends };
}

// rest of file...
```
