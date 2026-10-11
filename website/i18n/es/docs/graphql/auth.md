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

## Tokens de acceso {#access-tokens}

Aquí usaremos una variable miembro para llevar el registro del token de acceso y enviarlo
en un encabezado.

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

Luego asegúrate de establecer el token de acceso al iniciar sesión:

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

## Manejo del cierre de sesión por 401 {#401-logout-handling}

Cuando la autorización de un usuario expira, el servidor normalmente responderá para indicarlo.
La forma estándar de hacerlo es con un 401. [LogoutManager](/docs/api/LogoutManager)
puede usarse para activar fácilmente cualquier limpieza de desautorización.
