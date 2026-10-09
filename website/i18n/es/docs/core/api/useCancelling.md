---
frameworks: [react]
title: useCancelling() - Cancelación declarativa de fetch para React
sidebar_label: useCancelling()
description: Construye un Endpoint que cancela el fetch cada vez que cambian los parámetros. Aborta la petición en curso cuando cambian los parámetros.
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import PkgInstall from '@site/src/components/PkgInstall';
import UseCancelling from '../shared/\_useCancelling.mdx';

# useCancelling()

Construye un Endpoint que cancela el fetch cada vez que cambian los parámetros

[Aborta](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) la petición en curso si los parámetros cambian.

## Uso {#usage}

<UseCancelling />

:::warning[Advertencia]

Ten cuidado al usar esto con muchos componentes independientes que obtienen los mismos
argumentos (par Endpoint/params) con useSuspense(). Esta solución aborta los fetch por componente,
lo que significa que podrías terminar cancelando un fetch que otro componente todavía necesita.

:::

## Tipos {#types}

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```
