---
title: Endpoints padrão em TypeScript
sidebar_label: Protocolo personalizado
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import PkgTabs from '@site/src/components/PkgTabs';

# Endpoints padrão em TypeScript

Os [Endpoints](/rest/api/Endpoint) descrevem uma [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/) assíncrona. Isso inclui tanto o comportamento em tempo de execução quanto (opcionalmente) a tipagem.

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

Provavelmente vamos querer usar este endpoint em muitos lugares com necessidades diferentes.
Ao definir uma função reutilizável com _apenas_ a definição de rede, possibilitamos
seu uso em _qualquer_ contexto.

Isso é especialmente útil quando começamos a adicionar mais informações relacionadas ao
endpoint. Por exemplo, as definições de TypeScript nos ajudam a evitar erros comuns e erros de digitação,
e aceleram o desenvolvimento com autocomplete.

Ao _acoplar fortemente_ a definição da interface, enquanto _acoplamos fracamente_ o seu uso,
reduzimos o código boilerplate, a complexidade e os erros comuns, ao mesmo tempo que aumentamos o desempenho e
possibilitamos consistência e integridade globais na aplicação, mesmo diante de dados
assíncronos pouco confiáveis.

## Mais do que apenas uma função {#more-than-just-a-function}

Além de uma função assíncrona e de tipos (opcionais), os [Endpoint](/rest/api/Endpoint)s são objetos,
o que permite que forneçam qualquer informação adicional relevante sobre o próprio endpoint.

Por exemplo, para permitir a integração com um cache, bem como saber quando recalcular e/ou buscar novamente
quando os parâmetros mudam, os Endpoints têm um membro [key()](/rest/api/Endpoint#key) que serializa
o endpoint e os parâmetros em uma string única.

```js
console.log(todoDetail.key({ id: '1' }));
// fetchTodoDetail {"id":"1"}
```

### Membros {#members}

O segundo argumento, opcional, é um objeto com o qual inicializar o endpoint. Ao evitar arrow functions,
podemos usar [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
para acessar outros membros que definimos.

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

Por conveniência, [extend()](/rest/api/Endpoint#extend) permite extensões de um endpoint por
herança prototipal com tipagem correta.

Isso reduz bastante o código boilerplate quando padrões sólidos são estabelecidos para uma API, como
autenticação.

Aqui mostramos os benefícios de personalizar o membro [method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

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
