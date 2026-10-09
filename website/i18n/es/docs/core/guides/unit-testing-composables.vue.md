---
title: Pruebas unitarias de composables
framework_equivalent: guides/unit-testing-hooks
---

Los composables extraen la lógica de datos de los componentes, por lo que suelen ser el lugar más sencillo para probarla.
`renderDataCompose()` de `@data-client/vue/test` ejecuta un composable dentro de un componente montado
con [DataClientPlugin](../api/DataClientPlugin.md) y [Fixtures](../api/Fixtures.md).
Acepta las mismas [opciones](./unit-testing-components.md#options) y necesita la misma
[configuración](./unit-testing-components.md#setup) que [mountDataClient()](./unit-testing-components.md).

## renderDataCompose() {#renderdatacompose}

`renderDataCompose()` es asíncrono; haz `await` antes de leer `result`, que es lo que
devolvió el composable. [useQuery()](../api/useQuery.md) y [useCache()](../api/useCache.md) devuelven un
`ComputedRef`, así que sus datos están en `result.value`:

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

Llama siempre a `cleanup()` al final de una prueba; desmonta la aplicación y sus managers.

### useSuspense() {#usesuspense}

[useSuspense()](../api/useSuspense.md) devuelve una Promise que se resuelve a un `ComputedRef` cuando
los datos están disponibles. Haz `await` una sola vez y luego lee `.value`; la ref sigue siendo reactiva a medida que cambia el store.

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

Agrega `error: true` a un fixture para probar fallos; la Promise se rechaza entonces con ese error:

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

### Cambiar props {#changing-props}

El composable recibe `props`. Pasa un objeto `reactive()` y entrégale al composable un getter o
un `computed()` construido a partir de él para que siga los cambios:

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

### Mutaciones {#mutations}

El `controller` devuelto es el [Controller](../api/Controller.md) de la aplicación. Tras una mutación,
haz `await` y luego `nextTick()` antes de comprobar el resultado:

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

Una vez ejecutado el composable, se resuelve con los mismos `controller`, `wrapper`, `cleanup()` y
`allSettled()` que [mountDataClient()](./unit-testing-components.md#mountdataclient-api), además de:

| Miembro               | Descripción                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `result`              | Lo que devolvió el composable                                                                                                                                                   |
| `waitForNextUpdate()` | **Obsoleto.** Se rinde en silencio tras 1 segundo, por lo que una prueba puede pasar mientras sigue suspendida. Usa `await result` cuando `result` sea una Promise, y `await allSettled()` después de un cambio |
