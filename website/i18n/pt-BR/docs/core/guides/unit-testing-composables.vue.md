---
title: Testes unitários de composables
framework_equivalent: guides/unit-testing-hooks
---

Composables tiram a lógica de dados dos componentes, então muitas vezes são o lugar mais fácil para testá-la.
`renderDataCompose()` de `@data-client/vue/test` executa um composable dentro de um componente montado
com [DataClientPlugin](../api/DataClientPlugin.md) e [Fixtures](../api/Fixtures.md).
Ele recebe as mesmas [opções](./unit-testing-components.md#options) e precisa da mesma
[configuração](./unit-testing-components.md#setup) que o [mountDataClient()](./unit-testing-components.md).

## renderDataCompose() {#renderdatacompose}

`renderDataCompose()` é assíncrono; use `await` nele antes de ler `result`, que é o que quer que o
composable tenha retornado. [useQuery()](../api/useQuery.md) e [useCache()](../api/useCache.md) retornam um
`ComputedRef`, então seus dados ficam em `result.value`:

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { useQuery } from '@data-client/vue';
import { Article, ArticleResource } from './resources';

it('useQuery() returns cached data', async () => {
  const { result, cleanup } = await renderDataCompose(
    () => useQuery(Article, { id: 5 }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { id: 5, title: 'hi ho', content: 'whatever' },
        },
      ],
    },
  );

  expect(result.value?.title).toBe('hi ho');
  cleanup();
});
```

Sempre chame `cleanup()` no final de um teste; ele desmonta o app e seus managers.

### useSuspense() {#usesuspense}

[useSuspense()](../api/useSuspense.md) retorna uma Promise que resolve para um `ComputedRef` assim que os
dados estão disponíveis. Use `await` nela uma vez e depois leia `.value`; a ref continua reativa conforme o store muda.

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { nextTick } from 'vue';
import { ArticleResource } from './resources';

it('useSuspense() follows store updates', async () => {
  const { result, controller, cleanup } = await renderDataCompose(
    () => useSuspense(ArticleResource.get, { id: 5 }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { id: 5, title: 'hi ho', content: 'whatever' },
        },
      ],
    },
  );

  const article = await result;
  expect(article.value.title).toBe('hi ho');

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );
  await nextTick();
  expect(article.value.title).toBe('updated');

  cleanup();
});
```

Adicione `error: true` a uma fixture para testar falhas; a Promise então é rejeitada com esse erro:

```typescript
it('rejects on a failed fetch', async () => {
  const { result, cleanup } = await renderDataCompose(
    () => useSuspense(ArticleResource.get, { id: 5 }),
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { status: 404 },
          error: true,
        },
      ],
    },
  );

  await expect(result).rejects.toMatchObject({ status: 404 });
  cleanup();
});
```

### Alterando props {#changing-props}

O composable recebe `props`. Passe um objeto `reactive()` e entregue ao composable um getter ou
um `computed()` construído a partir dele, para que acompanhe as mudanças:

```typescript
import { reactive } from 'vue';

it('follows prop changes', async () => {
  const props = reactive({ id: 1 });
  const { result, cleanup } = await renderDataCompose(
    (props: { id: number }) => useQuery(Article, () => ({ id: props.id })),
    {
      props,
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 1 }],
          response: { id: 1, title: 'First', content: '' },
        },
        {
          endpoint: ArticleResource.get,
          args: [{ id: 2 }],
          response: { id: 2, title: 'Second', content: '' },
        },
      ],
    },
  );
  expect(result.value?.title).toBe('First');

  props.id = 2;
  await nextTick();
  expect(result.value?.title).toBe('Second');

  cleanup();
});
```

### Mutações {#mutations}

O `controller` retornado é o [Controller](../api/Controller.md) do app. Após uma mutação,
use `await` nela e depois `nextTick()` antes de verificar o resultado:

```typescript
it('push() adds to the list', async () => {
  const { result, controller, cleanup } = await renderDataCompose(
    () => useQuery(ArticleResource.getList.schema),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.getList,
          args: [],
          response: [{ id: 1, title: 'First', content: '' }],
        },
      ],
      resolverFixtures: [
        { endpoint: ArticleResource.getList.push, response: body => body },
      ],
    },
  );
  expect(result.value).toHaveLength(1);

  await controller.fetch(ArticleResource.getList.push, {
    id: 2,
    title: 'Second',
    content: '',
  });
  await nextTick();
  expect(result.value).toHaveLength(2);

  cleanup();
});
```

## API {#api}

### renderDataCompose(composable, options?) {#renderdatacompose-api}

Resolve, depois que o composable foi executado, para os mesmos `controller`, `wrapper`, `cleanup()` e
`allSettled()` do [mountDataClient()](./unit-testing-components.md#mountdataclient-api), além de:

| Membro                | Descrição                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `result`              | O que o composable retornou                                                                                                                                                    |
| `waitForNextUpdate()` | **Obsoleto.** Desiste silenciosamente após 1 segundo, então um teste pode passar mesmo ainda suspenso. Use `await result` para um `result` que seja uma Promise e `await allSettled()` após uma mudança |
