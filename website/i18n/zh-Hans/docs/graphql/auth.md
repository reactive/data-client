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
import { GQLEndpoint } from '@data-client/graphql';

class CookieGQLEndpoint extends GQLEndpoint<any> {
  getRequestInit(variables: any): RequestInit {
    return {
      ...super.getRequestInit(variables),
      credentials: 'same-origin',
    };
  }
}

export const gql = new CookieGQLEndpoint(
  'https://nosy-baritone.glitch.me',
);
export default gql;
```

## 访问令牌 {#access-tokens}

这里我们把访问令牌保存在一个模块变量中，并在 header 中发送它。用 `gql.query()` 和 `gql.mutation()`
创建的 endpoint 会在创建时复制 `gql`，因此之后在 `gql` 上设置的值不会传递给它们；而模块变量在每次请求时都会被读取。

```ts title="schema/endpoint.ts"
import { GQLEndpoint } from '@data-client/graphql';

let accessToken = '';
export function setAccessToken(token: string) {
  accessToken = token;
}

export const gql = new GQLEndpoint('https://nosy-baritone.glitch.me', {
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': accessToken,
    };
  },
});
export default gql;
```

然后务必在登录时设置访问令牌：

```ts
import { setAccessToken } from 'schema/endpoint';

function Auth() {
  const handleLogin = useCallback(
    async e => {
      const { accessToken } = await login(new FormData(e.target));
      // success!
      // highlight-next-line
      setAccessToken(accessToken);
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
