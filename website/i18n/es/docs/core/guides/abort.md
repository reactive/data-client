---
title: Cancelar un fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) ofrece una nueva forma de cancelar
los fetches que ya no se consideran relevantes. Esto se puede conectar a fetch mediante el segundo parámetro `RequestInit`.

## Resource {#resource}

La integración es sencilla con [RestEndpoint](/rest/api/RestEndpoint) mediante el miembro signal:

```typescript
const abort = new AbortController();
const AbortableArticle = CoolerArticleResource.get.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

## Endpoint {#endpoint}

Además, se puede agregar fácilmente una funcionalidad similar a cualquier endpoint usando miembros personalizados.

```typescript
type Params = { id: string };

const UserDetail = new Endpoint(
  function ({ id }: Params) {
    const init: RequestInit = {};
    if (this.signal) {
      init.signal = this.signal;
    }
    return fetch(this.url({ id }), init).then(res => res.json()) as Promise<
      typeof payload
    >;
  },
  {
    url({ id }: Params) { return `/users/${id}` },
    signal: undefined as AbortSignal | undefined,
  },
);
```

```typescript
const abort = new AbortController();
const AbortableUserDetail = UserDetail.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

::::react

## Cancelar cuando cambian los parámetros {#cancelling-on-params-change}

A veces el usuario tiene la oportunidad de completar un campo que afecta los resultados de una llamada de red.
Si es un campo de texto, podría escribir muy rápido y generar muchas solicitudes de red.

Usar [useCancelling()](/docs/api/useCancelling) cancelará automáticamente las solicitudes en curso si los parámetros
cambian antes de que se resuelva la solicitud.

<UseCancelling />

:::warning[Advertencia]

Ten cuidado al usar esto con muchos componentes independientes que obtienen los mismos
argumentos (par Endpoint/params) con useSuspense(). Esta solución aborta los fetches por componente,
lo que significa que podrías terminar cancelando un fetch que otro componente todavía necesita.

:::

::::
