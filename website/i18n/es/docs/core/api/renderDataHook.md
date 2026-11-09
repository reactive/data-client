---
frameworks: [react]
framework_equivalent: guides/unit-testing-composables
title: renderDataHook()
---

`renderDataHook()` es útil para probar hooks que dependen de `Reactive Data Client`. Replica el [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) de [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library), pero lo hace con un límite `<Suspense/>`
y dentro de un contexto `<Provider />`.

:::note

`renderDataHook()` crea un contexto de Provider con nuevas instancias de los managers. Esto significa que cada llamada
a `renderDataHook()` producirá un estado de caché y un estado de managers completamente nuevos.

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
      managers?: () => Manager[];
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
  /** @deprecated use cleanup() from the renderDataHook() return value */
  cleanup(): void;
  /** @deprecated use allSettled() from the renderDataHook() return value */
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

Hook que se ejecuta dentro de React. El valor de retorno estará disponible en [result.current](#result)

### options.initialFixtures {#optionsinitialfixtures}

Se puede usar para precargar la caché si la prueba espera que ya haya valores en ella. Recibe un
[array de fixtures](./Fixtures.md)

Tiene el mismo efecto que inicializar [&lt;DataProvider /\>](../api/DataProvider) con [mockInitialState()](../api/mockInitialState)

### options.resolverFixtures {#optionsresolverfixtures}

Estos [fixtures o interceptors](./Fixtures.md) se usan para resolver cualquier petición nueva. Es lo más útil para simular fetch imperativos como las mutaciones, pero también permite probar estados de suspensión o transiciones.

Funciona agregando [MockResolver](../api/MockResolver.md) como wrapper.

### options.getInitialInterceptorData {#optionsgetinitialinterceptordata}

Función que inicializa el atributo `this` de todos los interceptors.

### options.managers {#optionsmanagers}

Devuelve los [Managers](./Manager.md) que se usarán. Cada llamada a `renderDataHook()` la invoca una vez, así que cada prueba obtiene
instancias nuevas. El resultado reemplaza al [NetworkManager](./NetworkManager.md) y al
[SubscriptionManager](./SubscriptionManager.md) predeterminados. Debe incluir un `NetworkManager`; añade un `SubscriptionManager`
cuando la prueba necesite suscripciones.

Coloca un Manager antes de `NetworkManager` para ver las acciones `fetch`, porque `NetworkManager` las maneja sin
pasarlas al siguiente.

```ts
import type { Manager } from '@data-client/react';
import { NetworkManager, useController } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { TodoResource } from './resources/Todo';

it('logs every action', async () => {
  const types: string[] = [];
  const logger: Manager = {
    middleware: () => next => action => {
      types.push(action.type);
      return next(action);
    },
    cleanup() {},
  };
  // highlight-start
  const { controller } = renderDataHook(() => useController(), {
    managers: () => [logger, new NetworkManager()],
  });
  // highlight-end
  await controller.setResponse(
    TodoResource.get,
    { id: 5 },
    { id: 5, title: 'hi', completed: false },
  );
  expect(types).toEqual(['rdc/setresponse']);
});
```

### options.initialProps {#optionsinitialprops}

Los valores iniciales que se pasan a la función callback

### options.wrapper {#optionswrapper}

Pasa un componente de React como la opción wrapper para que se renderice alrededor del elemento interno

## Valores de retorno {#returns}

### controller {#controller}

[Controller](./Controller.md) para despachar efectos imperativos

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

Limpia los managers de este renderizado. El funcionamiento interno de Reactive Data Client usa temporizadores reales para evitar condiciones de carrera, así que
esto importa cuando simulas temporizadores.

La limpieza se ejecuta después de cada prueba en un hook `afterEach`, como en `@testing-library/react`. Llámala tú mismo solo para controlar
su orden dentro de una prueba. Por ejemplo, limpia antes de pasar de temporizadores simulados a temporizadores reales:

```ts
it('should handle polling', async () => {
  jest.useFakeTimers();
  const { result, cleanup } = renderDataHook(/* ... */);
  // ... assertions ...
  // highlight-next-line
  cleanup(); // must run while fake timers are still active
  jest.useRealTimers();
});
```

### allSettled() {#allsettled}

Devuelve una promesa que se resuelve cuando todas las peticiones en curso de este renderizado han terminado.

:::warning[Obsoleto]

`renderDataHook.cleanup()` y `renderDataHook.allSettled()` solo actúan sobre el último renderizado. Usa los que devuelve cada
llamada a `renderDataHook()`.

:::

### result {#result}

- `current` (`any`) - el valor de retorno de la función `callback`
- `error` (`Error`) - el error que se lanzó si la función `callback` lanzó un error durante el renderizado

### waitFor {#waitfor}

Devuelve una `Promise` que se resuelve si el callback proporcionado se ejecuta sin excepciones y devuelve un valor verdadero o undefined. Es seguro usar el resultado de renderDataHook dentro del callback para hacer aserciones o probar valores.

### waitForNextUpdate {#waitfornextupdate}

:::warning[Obsoleto]

Usa waitFor en su lugar

:::

Devuelve una `Promise` que se resuelve la próxima vez que el hook se renderiza, normalmente cuando el estado se actualiza como resultado de una acción asíncrona.

### rerender {#rerender}

(`function([newProps])`) - función para volver a renderizar el componente de prueba, incluidos los hooks llamados en la función `callback`. Si se pasan `newProps`, reemplazarán las `initialProps` pasadas a la función `callback` en los renderizados posteriores.

### unmount {#unmount}

(`function()`) - función para desmontar el componente de prueba, normalmente usada para disparar los efectos de limpieza de los hooks `useEffect`.

## Ejemplos {#examples}

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
