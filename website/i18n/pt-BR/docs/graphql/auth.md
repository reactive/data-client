---
title: Padrões de autenticação GraphQL para o Reactive Data Client
sidebar_label: Autenticação
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Autenticação GraphQL

## Autenticação por cookie {#cookie-auth}

Aqui está um exemplo usando autenticação simples por cookie:

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

## Access tokens {#access-tokens}

Aqui usaremos uma variável de membro para acompanhar o access token e enviá-lo
em um header.

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

Em seguida, defina o access token no login:

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

## Tratamento de logout em 401 {#401-logout-handling}

Caso a autorização de um usuário expire, o servidor normalmente responderá indicando
isso. A forma padrão de fazê-lo é com um 401. O [LogoutManager](/docs/api/LogoutManager)
pode ser usado para disparar facilmente qualquer limpeza de desautorização.
