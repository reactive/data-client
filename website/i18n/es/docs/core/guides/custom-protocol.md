---
title: Endpoints estándar de TypeScript
sidebar_label: Protocolo personalizado
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# Endpoints estándar de TypeScript

Los [Endpoints](/rest/api/Endpoint) describen una [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/) asíncrona. Contienen su comportamiento en tiempo de ejecución y, opcionalmente, sus tipos.

<PkgTabs pkgs="@data-client/endpoint" />

<LanguageTabs>

```typescript
interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
interface Params {
  id: number;
}

const fetchTodoDetail = ({ id }: Params): Promise<Todo> =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

// highlight-next-line
const todoDetail = new Endpoint(fetchTodoDetail);
```

```js
const fetchTodoDetail = ({ id }) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

// highlight-next-line
const todoDetail = new Endpoint(fetchTodoDetail);
```

</LanguageTabs>


<details>
<summary><b>Ejemplo de uso</b></summary>

```js
console.log(await todoDetail({ id: '1' }));
```

<samp>

```json
{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed": false
}
```

</samp>

</details>

El endpoint contiene _solo_ la definición de red, así que cualquier componente puede usarlo. Cada dato que le añades,
como los tipos de TypeScript, ayuda entonces a todos los lugares que lo usan: los tipos detectan erratas y ofrecen autocompletado.

Define la interfaz una vez y úsala en cualquier parte. Esto elimina código repetitivo y errores, y mantiene los datos consistentes en
toda la aplicación.

## Más que una simple función {#more-than-just-a-function}

Un [Endpoint](/rest/api/Endpoint) también es un objeto, así que puede contener más información sobre el endpoint.

Por ejemplo, [key()](/rest/api/Endpoint#key) serializa el endpoint y sus parámetros en un string único. La caché
lo usa para almacenar respuestas y para saber cuándo cambiaron los parámetros.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail [{"id":"1"}]
```

### Miembros {#members}

El segundo argumento opcional define los miembros del endpoint. Usa métodos, no funciones flecha, para que
[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) pueda leer los demás miembros.

```js
const todoDetailWithCustomizedKey = new Endpoint(fetchTodoDetail, {
  key({ id }) {
    return `${this.endpointIdentifier}/${id}`;
  },
  endpointIdentifier: 'todoDetail',
});
```

```js
console.log(todoDetailWithCustomizedKey.key({ id: '1' }));
// todoDetail/1
```

### Endpoint.extend() {#endpointextend}

[extend()](/rest/api/Endpoint#extend) crea un nuevo endpoint que hereda los miembros del original, con los tipos
correctos. Úsalo para compartir patrones, como la autenticación, en toda una API.

Este ejemplo cambia el miembro [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods):

```js
const fetchTodoDetail = function ({ id }) {
  return fetch(`${this.urlBase}/todos/${id}`, { method: this.method }).then(
    res => res.json(),
  );
};

const todoDetail = new Endpoint(fetchTodoDetail, {
  method: 'GET',
  urlBase: 'https://jsonplaceholder.typicode.com',
});
```

```js
const todoCreate = todoDetail.extend({ method: 'POST' });
const todoUpdate = todoDetail.extend({ method: 'PUT' });
```
