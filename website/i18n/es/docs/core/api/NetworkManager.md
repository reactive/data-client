---
title: NetworkManager - Orquestación de fetching eficiente y libre de condiciones de carrera
sidebar_label: NetworkManager
---

# NetworkManager

NetworkManager orquesta los fetches asíncronos. Al llevar el registro de todas las peticiones en curso,
puede deduplicar peticiones idénticas cuando se realizan con la bandera throttle.

:::info implements

`NetworkManager` implements [Manager](./Manager.md)

:::

## Ciclo de vida {#lifecycle}

### Éxito {#success}

import SuccessLifecycle from '../../rest/diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### Error {#error}

import ErrorLifecycle from '../../rest/diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Miembros {#members}

### constructor(\{ dataExpiryLength = 60000, errorExpiryLength = 1000 }) {#constructor}

Los argumentos representan el tiempo predeterminado (en milisegundos) antes de que un recurso se considere 'obsoleto'.

### middleware {#middleware}

#### Acciones consumidas {#consumed-actions}

- [fetch](./Controller.md#fetch)

Iniciará la petición de red y luego hará dispatch al completarse.

#### Acciones procesadas {#processed-actions}

- [fetch](./Controller.md#fetch)
- [setResponse](./Controller.md#setResponse)
- [resetEntireStore](./Controller.md#resetEntireStore)

#### Acciones despachadas {#dispatched-actions}

- [resolve](./Controller.md#resolve)

### allSettled(): Promise {#allSettled}

Se resuelve cuando todos los fetches en curso han terminado. Conceptualmente equivale a [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### skipLogging(action) {#skipLogging}

Lo usa DevtoolsManager para determinar si se debe registrar una acción

Valor predeterminado:

```ts
skipLogging(action: ActionTypes) {
  return action.type === FETCH && action.meta.key in this.fetched;
}
```

## Miembros protegidos {#protected-members}

### handleFetch(fetchAction) {#handlefetch}

Se llama cuando el middleware intercepta la acción 'rdc/fetch'.

Luego inicia una promesa para una clave y, potencialmente, inicia el fetch
de red.

Usa throttle solo cuando la meta de la acción lo indica. Esto es valioso
para garantizar que las peticiones de mutación siempre se realicen.

### handleSet(setAction) {#handleset}

Se llama cuando el middleware intercepta una acción set.

Luego resuelve la promesa asociada a la clave del set.

### throttle(key, fetch) {#throttle}

Garantiza que solo haya una petición en curso para una clave dada en cualquier momento.

Usa la clave para recuperar la promesa en curso o, si no existe,
crear una nueva promesa y llamar a fetch.

### getLastReset(): number {#getlastreset}

Marca de tiempo de la última vez que se reinició todo el store

### clear(key) {#clear}

Limpia el estado de la promesa para una clave dada

### clearAll() {#clearall}

Garantiza que todas las promesas se completen rechazando las restantes
