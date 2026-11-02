---
title: Abortando fetch
---

import UseCancelling from '../../core/shared/\_useCancelling.mdx';

O [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) oferece uma nova maneira de cancelar
fetches que deixaram de ser relevantes. Ele pode ser conectado ao fetch por meio do segundo parâmetro, `RequestInit`.

## Cancelando ao mudar os parâmetros {#cancelling-on-params-change}

Quando os parâmetros mudam rapidamente, como um leitor percorrendo uma caixa de entrada, cada mensagem por que ele passa inicia um download.
Cada resposta é armazenada sob seus próprios parâmetros, então uma resposta atrasada nunca substitui o que está na tela. Mas os
downloads que ele deixou para trás continuam, dividindo uma conexão lenta com o que ele realmente quer.

[useCancelling()](/docs/api/useCancelling) aborta a requisição em andamento assim que os parâmetros mudam, de modo que
a mensagem em que o leitor para é baixada sozinha.

<UseCancelling />

:::warning[Aviso]

Tenha cuidado ao usar isso com muitos componentes independentes que buscam os mesmos
argumentos (par Endpoint/params) em useSuspense(). Esta solução aborta fetches por componente,
o que significa que você pode acabar cancelando um fetch que outro componente ainda precisa.

:::
