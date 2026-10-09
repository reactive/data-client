---
frameworks: [react]
framework_equivalent: guides/unit-testing-composables
title: renderDataHook()
---

`renderDataHook()` é útil para testar hooks que dependem do `Reactive Data Client`. Ele espelha o [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) do [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library), mas o faz com um boundary `<Suspense/>`
e também dentro de um contexto `<Provider />`.

:::note

`renderDataHook()` cria um contexto Provider com novas instâncias de manager. Isso significa que cada chamada
a `renderDataHook()` resultará em um estado de cache totalmente novo, assim como em um estado de manager novo.

:::

<details>
<summary><b>Tipo</b></summary>

```typescript
type RenderDataHook = {
  <P, R, T = any>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      wrapper?: React.ComponentType;
    },
  ): {
    rerender: (props?: Props) => void;
    result: {
      current: Result;
      error?: Error;
    };
    unmount: () => void;
    controller: Controller;
    cleanup(): void;
    allSettled(): Promise<unknown>;
    /* @deprecated */
    waitForNextUpdate: (options?: waitForOptions) => Promise<void>;
    waitFor<T>(
      callback: () => Promise<T> | T,
      options?: waitForOptions,
    ): Promise<T>;
  };
  /** cleanup is automatic; only needed for ordering (e.g., before jest.useRealTimers()) */
  cleanup(): void;
  allSettled(): Promise<unknown>;
};
```

</details>

## Uso {#usage}

```typescript
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

it('useSuspense() should render the response', async () => {
  const { result, waitFor } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, { id: 5 });
    },
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response,
        },
      ],
    },
  );
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
});
```

## Argumentos {#arguments}

### callback {#callback}

Hook a ser executado dentro do React. O valor de retorno ficará disponível em [result.current](#result)

### options.initialFixtures {#optionsinitialfixtures}

Pode ser usado para preencher previamente o cache se o teste espera que os valores do cache já estejam preenchidos. Recebe um
[array de fixtures](./Fixtures.md)

Isso tem o mesmo efeito de inicializar [&lt;DataProvider /\>](../api/DataProvider) com [mockInitialState()](../api/mockInitialState)

### options.resolverFixtures {#optionsresolverfixtures}

Estas [fixtures ou interceptors](./Fixtures.md) são usadas para resolver quaisquer novas requisições. Isso é mais útil para simular fetches imperativos, como mutações, mas também permite testar estados de suspensão ou transições.

Funciona adicionando o [MockResolver](../api/MockResolver.md) como wrapper.

### options.getInitialInterceptorData {#optionsgetinitialinterceptordata}

Função que inicializa o atributo `this` de todos os interceptors.

### options.initialProps {#optionsinitialprops}

Os valores iniciais a passar para a função de callback

### options.wrapper {#optionswrapper}

Passe um componente React na opção wrapper para que ele seja renderizado ao redor do elemento interno

## Retorno {#returns}

### controller {#controller}

[Controller](./Controller.md) para despachar efeitos imperativos

```ts
import { act } from '@testing-library/react';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Todo, TodoResource } from './resources/Todo';

it('should update', async () => {
  const id = 5;
  const payload = { title: 'first item', id, completed: false };
  // highlight-next-line
  const { result, controller } = renderDataHook(
    () => {
      return useSuspense(TodoResource.getList);
    },
    {
      initialFixtures: [
        {
          endpoint: TodoResource.getList,
          args: [],
          response: [payload],
        },
      ],
      resolverFixtures: [
        {
          endpoint: TodoResource.update,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  expect(result.current).toEqual([Todo.fromJS(payload)]);
  // highlight-start
  await act(async () => {
    await controller.fetch(
      TodoResource.update,
      { id },
      { title: 'updated title' },
    );
  });
  // highlight-end
  expect(result.current[0].title).toBe('updated title');
});
```

### cleanup() {#cleanup}

Limpa todos os managers usados nesta renderização.
Isso é especialmente importante ao simular timers, pois o funcionamento interno do Reactive Data Client depende de timers reais para
evitar race conditions.

A limpeza é executada automaticamente após cada teste por meio de um hook `afterEach` em nível de módulo (semelhante ao `@testing-library/react`).
Chamadas manuais só são necessárias quando você precisa controlar a ordem da limpeza dentro do corpo de um teste -- por exemplo,
limpar antes de trocar de timers falsos para timers reais:

```ts
it('should handle polling', async () => {
  jest.useFakeTimers();
  const { result } = renderDataHook(/* ... */);
  // ... assertions ...
  // highlight-next-line
  renderDataHook.cleanup(); // must run while fake timers are still active
  jest.useRealTimers();
});
```

### allSettled() {#allsettled}

Retorna uma promise que é resolvida assim que todas as requisições em andamento forem concluídas.

Também disponível no valor de retorno de cada chamada de `renderDataHook()`.

### result {#result}

- `current` (`any`) - o valor de retorno da função `callback`
- `error` (`Error`) - o erro lançado caso a função `callback` tenha lançado um erro durante a renderização

### waitFor {#waitfor}

Retorna uma `Promise` que é resolvida se o callback fornecido for executado sem exceção e retornar um valor truthy ou undefined. É seguro usar o resultado de renderDataHook no callback para fazer asserções ou testar valores.

### waitForNextUpdate {#waitfornextupdate}

:::warning[Descontinuado]

Use waitFor em vez disso

:::

Retorna uma `Promise` que é resolvida na próxima vez que o hook renderizar, normalmente quando o estado é atualizado como resultado de uma ação assíncrona.

### rerender {#rerender}

(`function([newProps])`) - função para rerrenderizar o componente de teste, incluindo quaisquer hooks chamados na função `callback`. Se `newProps` forem passadas, elas substituirão as `initialProps` passadas à função `callback` nas renderizações seguintes.

### unmount {#unmount}

(`function()`) - função para desmontar o componente de teste, normalmente usada para disparar os efeitos de limpeza dos hooks `useEffect`.

## Exemplos {#examples}

```typescript
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

it('should resolve useSuspense()', async () => {
  const { result, waitFor, controller } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, response);
    },
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          response: ({ id }) => ({ ...response, id }),
        },
        {
          endpoint: ArticleResource.partialUpdate,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  // this indicates suspense
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: response.id },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```
