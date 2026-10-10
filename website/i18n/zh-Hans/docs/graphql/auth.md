---
title: Reactive Data Client 的 GraphQL 认证模式
sidebar_label: 认证
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GraphQL 认证

## Cookie 认证 {#cookie-auth}

下面是一个使用简单 cookie 认证的示例：

```ts title="schema/endpoint.ts"
export const gql = new GQLEndpoint('https://nosy-baritone.glitch.me', {
  getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...super.getRequestInit(body),
      credentials: 'same-origin',
    };
  }
});
export default gql;
```

## 访问令牌 {#access-tokens}

这里我们使用一个成员变量来记录访问令牌，并在
header 中发送它。

```ts title="schema/endpoint.ts"
export const gql = new GQLEndpoint('https://nosy-baritone.glitch.me', {
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': this.accessToken,
    };
  },
});
export default gql;
```

然后务必在登录时设置访问令牌：

```ts
import gql from 'schema/endpoint';

function Auth() {
  const handleLogin = useCallback(
    async e => {
      const { accessToken } = await login(new FormData(e.target));
      // success!
      // highlight-next-line
      gql.accessToken = accessToken;
    },
    [login],
  );

  return <AuthForm onSubmit={handleLogin} />;
}
```

## 401 登出处理 {#401-logout-handling}

当用户的授权过期时，服务器通常会返回响应来表明这一点。
标准做法是返回 401。[LogoutManager](/docs/api/LogoutManager)
可以轻松触发任何取消授权的清理工作。
