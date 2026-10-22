---
frameworks: [react]
title: useCancelling() - Cancelamento declarativo de fetch para React
sidebar_label: useCancelling()
description: Cria um Endpoint que cancela o fetch sempre que os parâmetros mudam. Aborta a requisição em andamento quando os parâmetros mudam.
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import PkgInstall from '@site/src/components/PkgInstall';
import UseCancelling from '../shared/\_useCancelling.mdx';

# useCancelling()

Cria um Endpoint que cancela o fetch sempre que os parâmetros mudam

[Aborta](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) a requisição em andamento se os parâmetros mudarem.

## Uso {#usage}

<UseCancelling />

:::warning[Aviso]

Tenha cuidado ao usar isto com muitos componentes independentes buscando os mesmos
argumentos (par Endpoint/params) com useSuspense(). Esta solução aborta os fetches por componente,
o que significa que você pode acabar cancelando um fetch com o qual outro componente ainda se importa.

:::

## Tipos {#types}

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```