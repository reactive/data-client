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

## Access tokens {#access-tokens}

Aqui guardaremos o access token em uma variável de módulo e o enviaremos em um header. Os endpoints criados com
`gql.query()` e `gql.mutation()` copiam `gql` quando são criados, então um valor definido em `gql` depois
não os alcançaria; uma variável de módulo é lida a cada requisição.

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

Em seguida, defina o access token no login:

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

## Tratamento de logout em 401 {#401-logout-handling}

Caso a autorização de um usuário expire, o servidor normalmente responderá indicando
isso. A forma padrão de fazê-lo é com um 401. O [LogoutManager](/docs/api/LogoutManager)
pode ser usado para disparar facilmente qualquer limpeza de desautorização.
