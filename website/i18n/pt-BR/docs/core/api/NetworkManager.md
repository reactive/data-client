---
title: NetworkManager - Orquestrando fetches eficientes e sem condições de corrida
sidebar_label: NetworkManager
---

# NetworkManager

O NetworkManager orquestra fetches assíncronos. Ao rastrear todas as requisições em andamento,
ele consegue deduplicar requisições idênticas quando elas são feitas com a flag throttle.

:::info implements

`NetworkManager` implementa [Manager](./Manager.md)

:::

## Ciclo de vida {#lifecycle}

### Sucesso {#success}

import SuccessLifecycle from '../../rest/diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### Erro {#error}

import ErrorLifecycle from '../../rest/diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Membros {#members}

### construtor(\{ dataExpiryLength = 60000, errorExpiryLength = 1000 }) {#constructor}

Os argumentos representam o tempo padrão (em milissegundos) antes de um recurso ser considerado 'desatualizado'.

### middleware {#middleware}

#### Actions consumidas {#consumed-actions}

- [fetch](./Controller.md#fetch)

Iniciará a requisição de rede e, ao concluir, fará o dispatch.

#### Actions processadas {#processed-actions}

- [fetch](./Controller.md#fetch)
- [setResponse](./Controller.md#setResponse)
- [resetEntireStore](./Controller.md#resetEntireStore)

#### Actions despachadas {#dispatched-actions}

- [resolve](./Controller.md#resolve)

### allSettled(): Promise {#allSettled}

Resolve quando todos os fetches em andamento forem concluídos. Conceitualmente equivale a [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### skipLogging(action) {#skipLogging}

Usado pelo DevtoolsManager para determinar se uma action deve ser registrada em log

Padrão:

```ts
skipLogging(action: ActionTypes) {
  return action.type === FETCH && action.meta.key in this.fetched;
}
```

## Membros protegidos {#protected-members}

### handleFetch(fetchAction) {#handlefetch}

Chamado quando o middleware intercepta a action 'rdc/fetch'.

Em seguida, inicia uma promise para uma key e, possivelmente, inicia o
fetch de rede.

Usa throttle somente quando instruído pelo meta da action. Isso é útil
para garantir que as requisições de mutação sempre sejam executadas.

### handleSet(setAction) {#handleset}

Chamado quando o middleware intercepta uma action set.

Resolverá a promise associada à key do set.

### throttle(key, fetch) {#throttle}

Garante que apenas uma requisição para uma determinada key esteja em andamento a qualquer momento.

Usa a key para recuperar a promise em andamento ou, se não houver,
criar uma nova promise e chamar fetch.

### getLastReset(): number {#getlastreset}

Timestamp da última vez em que o store inteiro foi resetado

### clear(key) {#clear}

Limpa o estado da promise para uma determinada key

### clearAll() {#clearall}

Garante que todas as promises sejam concluídas rejeitando as restantes

