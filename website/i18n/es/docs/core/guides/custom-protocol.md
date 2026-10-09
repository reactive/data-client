---
title: Endpoints estándar de TypeScript
sidebar_label: Protocolo personalizado
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# Endpoints estándar de TypeScript

Los [Endpoints](/rest/api/Endpoint) describen una [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/) asíncrona. Esto incluye tanto el comportamiento en tiempo de ejecución como (opcionalmente) el tipado.

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

Probablemente querremos usar este endpoint en muchos lugares con necesidades distintas.
Al definir una función reutilizable con _solo_ la definición de red, habilitamos
su uso en _cualquier_ contexto.

Esto es especialmente útil cuando empezamos a agregar más información relacionada con el
endpoint. Por ejemplo, las definiciones de TypeScript nos ayudan a evitar errores comunes y erratas,
y aceleran el desarrollo con el autocompletado.

Al _acoplar estrechamente_ la definición de la interfaz, y _acoplar de forma laxa_ su uso,
reducimos el código repetitivo, la complejidad y los errores comunes, a la vez que aumentamos el rendimiento y
habilitamos la consistencia e integridad global de la aplicación incluso ante datos
asíncronos poco fiables.

## Más que una simple función {#more-than-just-a-function}

Además de una función asíncrona y tipos (opcionales), los [Endpoint](/rest/api/Endpoint) son objetos,
lo que les permite proporcionar cualquier información relevante adicional sobre el propio endpoint.

Por ejemplo, para permitir la integración con una caché y saber cuándo recalcular y/o volver a obtener los datos
cuando cambian los parámetros, los Endpoints tienen un miembro [key()](/rest/api/Endpoint#key) que serializa
el endpoint y los parámetros en un string único.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail {"id":"1"}
```

### Miembros {#members}

El segundo argumento opcional es un objeto con el que inicializar el endpoint. Al evitar las funciones flecha,
podemos usar [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
para acceder a otros miembros que hayamos definido.

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

Por comodidad, [extend()](/rest/api/Endpoint#extend) permite extensiones de un endpoint mediante
herencia prototípica con tipado correcto.

Esto reduce enormemente el código repetitivo cuando se establecen patrones sólidos para una API, como
la autenticación.

Aquí mostramos los beneficios de personalizar el miembro [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

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
