---
title: Cancelar un fetch
---

import UseCancelling from '../../core/shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) ofrece una nueva forma de cancelar
las peticiones que dejan de ser relevantes. Se puede conectar al fetch mediante el segundo parámetro `RequestInit`.

## Cancelar al cambiar los parámetros {#cancelling-on-params-change}

Cuando los parámetros cambian rápido, como cuando un lector recorre una bandeja de entrada, cada mensaje por el que pasa inicia una descarga.
Cada respuesta se almacena bajo sus propios parámetros, así que una respuesta tardía nunca reemplaza lo que hay en pantalla. Pero las
descargas que quedaron atrás siguen en curso y comparten una conexión lenta con la que el lector realmente quiere.

[useCancelling()](/docs/api/useCancelling) aborta la petición en curso en cuanto cambian los parámetros, de modo que
el mensaje en el que el lector se detiene se descarga solo.

<UseCancelling />

:::warning[Advertencia]

Ten cuidado al usar esto con muchos componentes independientes que obtienen los mismos
argumentos (par Endpoint/params) con useSuspense(). Esta solución cancela los fetch por componente,
lo que significa que podrías cancelar un fetch que otro componente todavía necesita.

:::
