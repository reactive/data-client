---
title: LogoutManager - 处理 401 及其他取消授权的触发条件
sidebar_label: LogoutManager
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# LogoutManager

根据请求响应执行登出。默认情况下，由 [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) 状态的响应触发。

:::info 实现

`LogoutManager` 实现了 [Manager](./Manager.md)

:::

## 用法 {#usage}

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];
```

</ProviderManagers>

### 自定义登出处理函数 {#custom-logout-handler}

```ts
import { unAuth } from '../authentication';

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      controller.resetEntireStore();
    },
  }),
  ...getDefaultManagers(),
];
```

:::tip

使用 [controller.invalidateAll](./Controller.md#invalidateAll) 只清除部分缓存。

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
// highlight-next-line
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      // highlight-next-line
      controller.invalidateAll({ testKey });
    },
  }),
  ...getDefaultManagers(),
];
```

:::

## 成员 {#members}

### handleLogout(controller) {#handlelogoutcontroller}

默认情况下只是调用 [controller.resetEntireStore()](./Controller.md#resetEntireStore)

如果登录状态由 Reactive Data Client store 中是否存在用户 Entity 决定，这样就足够了。不过，
如果需要做更多事情，你可以通过继承来重写这个方法。

### shouldLogout(error) {#shouldlogouterror}

```ts
protected shouldLogout(error: UnknownError) {
  // 401 indicates reauthorization is needed
  return error.status === 401;
}
```

:::react

## Github 示例 {#github-example}

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />

:::
