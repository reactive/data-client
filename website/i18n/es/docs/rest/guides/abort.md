---
title: Cancelar un fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../../core/shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) ofrece una nueva forma de cancelar
las peticiones que dejan de ser relevantes. Se puede conectar al fetch mediante el segundo parámetro `RequestInit`.

## Cancelar al cambiar los parámetros {#cancelling-on-params-change}

A veces el usuario puede rellenar un campo que afecta a los resultados de una llamada de red.
Si es un campo de texto, podría escribir muy rápido y generar muchas peticiones de red.

Usar [useCancelling()](/docs/api/useCancelling) cancelará automáticamente las peticiones en curso si los parámetros
cambian antes de que la petición se resuelva.

<UseCancelling />

:::warning[Advertencia]

Ten cuidado al usar esto con muchos componentes independientes que obtienen los mismos
argumentos (par Endpoint/params) con useSuspense(). Esta solución cancela los fetch por componente,
lo que significa que podrías cancelar un fetch que otro componente todavía necesita.

:::
