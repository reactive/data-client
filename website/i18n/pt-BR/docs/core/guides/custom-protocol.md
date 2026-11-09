---
title: Endpoints padrão em TypeScript
sidebar_label: Protocolo personalizado
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# Endpoints padrão em TypeScript

Os [Endpoints](/rest/api/Endpoint) descrevem uma [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/) assíncrona. Eles guardam o comportamento em tempo de execução e, opcionalmente, os tipos dela.

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
<summary><b>Exemplo de uso</b></summary>

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

O endpoint guarda _apenas_ a definição de rede, então qualquer componente pode usá-lo. Cada informação que você adiciona
a ele, como os tipos do TypeScript, passa a ajudar todos os lugares que o usam: os tipos pegam erros de digitação e dão autocomplete.

Defina a interface uma vez e use-a em qualquer lugar. Isso remove código boilerplate e erros, e mantém os dados consistentes em toda
a aplicação.

## Mais do que apenas uma função {#more-than-just-a-function}

Um [Endpoint](/rest/api/Endpoint) também é um objeto, então pode guardar mais informações sobre o endpoint.

Por exemplo, [key()](/rest/api/Endpoint#key) serializa o endpoint e seus parâmetros em uma string única. O cache
a usa para armazenar respostas e para saber quando os parâmetros mudaram.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail [{"id":"1"}]
```

### Membros {#members}

O segundo argumento, opcional, define os membros do endpoint. Use métodos, não arrow functions, para que
[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) possa ler os outros membros.

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

[extend()](/rest/api/Endpoint#extend) cria um novo endpoint que herda os membros do original, com tipagem correta. Use-o
para compartilhar padrões, como autenticação, em uma API.

Este exemplo altera o membro [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods):

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
