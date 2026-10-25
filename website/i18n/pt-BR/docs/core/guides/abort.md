---
title: Abortando fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../shared/\_useCancelling.mdx';

O [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) oferece uma nova maneira de cancelar
fetches que deixaram de ser relevantes. Ele pode ser conectado ao fetch por meio do segundo parâmetro, `RequestInit`.

## Resource {#resource}

A integração é simples com o [RestEndpoint](/rest/api/RestEndpoint), por meio do membro signal:

```typescript
const abort = new AbortController();
const AbortableArticle = CoolerArticleResource.get.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

## Endpoint {#endpoint}

Além disso, funcionalidade semelhante pode ser adicionada com facilidade a qualquer endpoint usando membros personalizados.

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

## Cancelando ao mudar os parâmetros {#cancelling-on-params-change}

Às vezes o usuário pode preencher um campo que afeta os resultados de uma chamada de rede.
Se for um campo de texto, ele pode digitar muito rápido, gerando um grande número de requisições de rede.

Usar [useCancelling()](/docs/api/useCancelling) cancela automaticamente as requisições em andamento se os parâmetros
mudarem antes que a requisição seja resolvida.

<UseCancelling />

:::warning[Aviso]

Tenha cuidado ao usar isso com muitos componentes independentes que buscam os mesmos
argumentos (par Endpoint/params) em useSuspense(). Esta solução aborta fetches por componente,
o que significa que você pode acabar cancelando um fetch que outro componente ainda precisa.

:::

::::
