---
title: Patrones de autenticación de GraphQL para Reactive Data Client
sidebar_label: Autenticación
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Autenticación en GraphQL

## Autenticación con cookies {#cookie-auth}

Este es un ejemplo con autenticación simple mediante cookies:

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

## Tokens de acceso {#access-tokens}

Aquí guardaremos el token de acceso en una variable del módulo y lo enviaremos en un encabezado. Los endpoints creados con
`gql.query()` y `gql.mutation()` copian `gql` al crearse, así que un valor asignado después en `gql`
no les llegaría; una variable del módulo se lee en cada petición.

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

Luego asegúrate de establecer el token de acceso al iniciar sesión:

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

## Manejo del cierre de sesión por 401 {#401-logout-handling}

Cuando la autorización de un usuario expira, el servidor normalmente responderá para indicarlo.
La forma estándar de hacerlo es con un 401. [LogoutManager](/docs/api/LogoutManager)
puede usarse para activar fácilmente cualquier limpieza de desautorización.
