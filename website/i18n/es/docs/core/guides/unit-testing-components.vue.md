---
title: Pruebas unitarias de componentes
---

import PkgTabs from '@site/src/components/PkgTabs';

:::warning

Ten cuidado al usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) en módulos como Reactive Data Client. Eliminar exports
esperados puede provocar errores difíciles de rastrear,
como `TypeError: Class extends value undefined is not a function or null`.

En su lugar, carga las respuestas con [Fixtures](../api/Fixtures.md).

:::

`@data-client/vue/test` monta componentes con [DataClientPlugin](../api/DataClientPlugin.md),
un límite `<Suspense>` y [Fixtures](../api/Fixtures.md), de modo que las pruebas pueden comprobar lo que renderiza
un componente sin un ciclo de fetch de red. Para probar composables por separado, consulta
[Pruebas unitarias de composables](./unit-testing-composables.md).

## Configuración {#setup}

Las utilidades de prueba están construidas sobre [Vue Test Utils](https://test-utils.vuejs.org/), así que instálalo
junto con tu ejecutor de pruebas. Jest necesita el [entorno jsdom](https://jestjs.io/docs/configuration#testenvironment-string).

<PkgTabs pkgs="@vue/test-utils jest-environment-jsdom" dev />

## mountDataClient() {#mountdataclient}

[initialFixtures](#options)
llenan el store antes del primer renderizado, de modo que un componente que hace `await` de
[useSuspense()](../api/useSuspense.md) renderice sus datos de inmediato.

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { defineComponent, h } from 'vue';
import { ArticleResource } from './resources';
import { flushUntil } from './flushUntil';

const ArticleDetail = defineComponent({
  props: { id: { type: Number, required: true } },
  async setup(props) {
    // a getter so the fetch follows props.id
    const article = await useSuspense(ArticleResource.get, () => ({
      id: props.id,
    }));
    return () => h('h3', article.value.title);
  },
});

it('renders the article', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');

  cleanup();
});
```

Llama siempre a `cleanup()` al final de una prueba; desmonta la aplicación y sus managers.

### Esperar a los renderizados {#waiting-for-renders}

El `setup()` asíncrono y Suspense se resuelven a lo largo de varias microtareas y ticks, así que espera a lo que
la prueba necesita en lugar de un número fijo de ticks:

```typescript title="flushUntil.ts"
import { nextTick } from 'vue';

export async function flushUntil(predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('flushUntil: condition never became true');
}
```

### Estado de carga {#loading-state}

Mientras un componente está suspendido, `mountDataClient()` renderiza un elemento con
`data-testid="suspense-fallback"`. Usa [resolverFixtures](#options) para responder a los fetch que el store
aún no tiene:

```typescript
it('shows the fallback until the fetch resolves', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(true);

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('Article 5');

  cleanup();
});
```

El `response` de un interceptor recibe los argumentos del endpoint, así que un solo fixture puede responder a cualquier
`id`. Agrega `error: true` a un fixture para que sea rechazado; consulta [Fixtures](../api/Fixtures.md) para ver todas las
formas de fixture.

### Cambiar props {#changing-props}

Pasa un objeto `reactive()` como `props` y luego modifica sus miembros para cambiar las props del componente:

```typescript
import { reactive } from 'vue';

it('fetches the new article when id changes', async () => {
  const props = reactive({ id: 1 });
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props,
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  await flushUntil(() => wrapper.text() === 'Article 1');

  props.id = 2;
  await flushUntil(() => wrapper.text() === 'Article 2');

  cleanup();
});
```

Un `setup()` asíncrono se ejecuta una vez por instancia de componente, así que pasa los argumentos derivados de props como un getter
(`() => ({ id: props.id })`) o con `computed()`. Un `{ id: props.id }` simple se lee una sola vez y no
seguirá los cambios de las props.

### Mutaciones {#mutations}

El `controller` devuelto es el [Controller](../api/Controller.md) de la aplicación. Ejecuta con él mutaciones o
[setResponse()](../api/Controller.md#setResponse) y luego espera a que el componente se actualice:

```typescript
it('re-renders when the store changes', async () => {
  const { wrapper, controller, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });
  await flushUntil(() => wrapper.find('h3').exists());

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );

  await flushUntil(() => wrapper.find('h3').text() === 'updated');
  cleanup();
});
```

## API {#api}

### mountDataClient(component, options?) {#mountdataclient-api}

Devuelve

| Miembro        | Descripción                                                  |
| -------------- | ------------------------------------------------------------ |
| `wrapper`      | [VueWrapper](https://test-utils.vuejs.org/api/#wrapper-methods) de Vue Test Utils del árbol montado |
| `controller`   | El [Controller](../api/Controller.md) de la aplicación               |
| `app`          | La instancia de la aplicación Vue                                     |
| `cleanup()`    | Desmonta y detiene los managers                              |
| `allSettled()` | Se resuelve cuando termina cada fetch en curso, incluidos los que un cambio de props acaba de iniciar, y el componente se ha vuelto a renderizar |

### Options {#options}

`mountDataClient()` y [renderDataCompose()](./unit-testing-composables.md) aceptan las mismas opciones.

```typescript
interface RenderDataClientOptions<P = any> {
  /** Props for the component; pass a reactive() object to change them */
  props?: Reactive<P>;
  /** Responses in the store before the first render */
  initialFixtures?: readonly Fixture[];
  /** Answer fetches made during the test */
  resolverFixtures?: readonly (Fixture | Interceptor)[];
  /** Initial `this` for interceptors */
  getInitialInterceptorData?: () => any;
  /** Replace the default NetworkManager and SubscriptionManager */
  managers?: Manager[];
  /** Replace the state built from initialFixtures */
  initialState?: State<unknown>;
  gcPolicy?: GCInterface;
  /** Component rendered around the tested component (receives the same props) */
  wrapper?: Component;
}
```

[mockInitialState()](../api/mockInitialState.md) construye `initialState` a partir de fixtures, para
montar con tu propia configuración de `DataClientPlugin`.
