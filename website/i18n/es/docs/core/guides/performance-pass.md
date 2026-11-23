---
frameworks: [react]
title: Pasada de rendimiento
sidebar_label: Pasada de rendimiento
description: Encuentra las mejoras de velocidad que le pueden faltar a una aplicación con Data Client, como las páginas de detalle a partir de datos de listas, los loaders que no esperan a los datos secundarios y las actualizaciones optimistas.
---

import DiffEditor from '@site/src/components/DiffEditor';

# Pasada de rendimiento {#performance-pass}

Data Client puede hacer una aplicación más rápida de lo que muestra una migración simple. Ejecuta esta pasada después de una migración, o en cualquier momento en una
aplicación que ya use Data Client.

Una migración ya debería dar las [mejoras integradas](#built-in): requieren poco código y corrigen comportamientos obsoletos o lentos,
así que comprueba que estén en su lugar y corrige las que falten. Los [cambios con contrapartidas](#tradeoffs) necesitan código
adicional o cambian lo que ven los usuarios, como cuándo se muestra un estado de carga o cuándo aparece un cambio. Forman una etapa aparte y
opcional: hazlos uno a uno, mantén las pruebas pasando y omite los que no quieras.

## Mide primero {#measure}

Registra una línea base antes de cambiar nada y vuelve a medir después de cada cambio:

- **Peticiones:** en el panel Network del navegador, cuenta las lecturas de cada navegación y después de cada mutación.
- **Tiempo hasta la actualización:** en el panel Performance, el tiempo desde un clic hasta que la pantalla muestra su resultado, no solo
  hasta el siguiente pintado. Limita la CPU y añade latencia de red para que los números se parezcan a los de dispositivos reales.
- **Renderizados:** el Profiler de React DevTools muestra qué componentes se renderizan después de una actualización.

Sin navegador, cuenta las peticiones que hace cada flujo a partir del código y sus pruebas, e indica cómo las contaste.

## Mejoras integradas {#built-in}

### Detalles a partir de listas {#list-detail}

Un endpoint de detalle cuyo schema contiene la [Entity](/rest/api/Entity) de la lista renderiza un elemento que la lista ya cargó,
sin fetch, mientras esos datos estén frescos. La búsqueda usa los args del endpoint, así que deben usar el nombre de campo que lee el
`pk()` de la Entity (`{ id }`, no `{ issueId }`), o un campo de sus [indexes](/rest/api/Entity#indexes).

- **Qué buscar:** endpoints de detalle sin schema, o con un schema que omite la Entity; args de detalle que no nombran
  ni la clave primaria ni un índice (`{ slug }` sin `static indexes = ['slug']`); datos de la lista copiados a mano al
  detalle.
- **Qué cambiar:** define el schema del detalle como la Entity, o como un objeto que la contenga, como `{ data: Issue }`. Para otros campos
  de búsqueda, añade un índice en lugar de renombrar los args. Elimina la copia. Cuando la lista devuelve menos campos que el
  detalle, dale a la lista una Entity de resumen, y haz que la Entity del detalle la extienda con la misma `key` y un
  `validate()`, de modo que el detalle siga obteniendo el elemento completo ([entities parciales](/rest/guides/partial-entities)).
- **Qué ven los usuarios:** la página de detalle aparece al instante al abrirla desde la lista. No hace ninguna petición mientras la lista esté fresca
  y tenga todos los campos que el detalle requiere.

### Una Entity en todas partes {#entities}

Cada lugar que muestra un objeto del servidor lee la misma Entity, así que una respuesta actualiza todos.

- **Qué buscar:** campos de Entity que contienen objetos con su propio id pero sin una entrada en [`static schema`](/rest/api/Entity#schema);
  dos clases Entity con claves distintas para el mismo objeto del servidor (una Entity de resumen que la Entity de detalle extiende
  con la misma `key` está bien); endpoints de actualización sin schema; `ctrl.expireAll()`,
  `ctrl.invalidate()` o un refetch después de una actualización.
- **Qué cambiar:** anida la Entity en `static schema` (`{ author: User, labels: [Label] }`), dale a los endpoints de actualización la
  Entity como schema y elimina el refetch.
- **Qué ven los usuarios:** una edición aparece en cada fila, tarjeta y detalle al instante, sin ninguna petición.

### Las mutaciones actualizan las listas en su lugar {#lists}

- **Qué buscar:** `ctrl.expireAll()`, `ctrl.invalidate()` o un refetch de una lista después de crear, eliminar, o de un cambio que
  mueve un elemento entre listas filtradas.
- **Qué cambiar:** crea mediante el endpoint `push` o `unshift` de la [Collection](/rest/api/Collection) de la lista; elimina con
  `resource().delete` o un schema [Invalidate](/rest/api/Invalidate); mueve con el endpoint
  [`move`](/rest/api/RestEndpoint#move) de la Collection. Conserva `expireAll()` para páginas numeradas, cuyos elementos posteriores se desplazan; para
  listas cuyo orden o pertenencia decide el servidor; y para datos que la respuesta no incluye, como conteos y
  totales.
- **Qué ven los usuarios:** el elemento nuevo, eliminado o movido aparece sin recargar la lista.

### Las lecturas omiten los datos frescos {#fetch-if-stale}

- **Qué buscar:** `useEffect()` que hace fetch; `ctrl.fetch()` de un endpoint de lectura en loaders de rutas o manejadores de precarga.
- **Qué cambiar:** los componentes leen con `useSuspense()` o [useFetch()](../api/useFetch.md). Solo el código donde los hooks no pueden
  ejecutarse, como los loaders de rutas y la precarga al pasar el cursor, llama a `ctrl.fetchIfStale()`. `ctrl.fetch()` siempre hace una petición, incluso
  cuando el store tiene datos frescos, así que consérvalo solo donde el usuario pide una actualización.
- **Qué ven los usuarios:** ningún cambio; menos peticiones por navegación.

## Cambios con contrapartidas {#tradeoffs}

### Los loaders no esperan a los datos secundarios {#loaders}

Un loader de router que hace await de cada petición obliga a la página a esperar a la más lenta, incluso cuando el elemento principal vino de
la lista. En un router que cambia la ruta dentro de una transición, inicia cada `fetchIfStale()` sin hacerle await: la página
renderiza lo que está en caché y se suspende por el resto, manteniendo mientras tanto la página actual. Dale a cada componente que lee
datos secundarios su propio [AsyncBoundary](../api/AsyncBoundary.md), para que cargue sin retener la página. Cuando la página
renderiza el valor de retorno del loader, devuelve solo el elemento principal, como muestra [Loaders de rutas](../api/Controller.md#fetchIfStale-loaders).

<DiffEditor>

```ts title="Before"
export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) => {
    const id = Number(params.issueId);
    return Promise.all([
      ctrl.fetchIfStale(IssueResource.get, { id }),
      ctrl.fetchIfStale(getNotes, { issueId: id }),
    ]);
  };
```

```ts title="After"
export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) => {
    const id = Number(params.issueId);
    // callout: Not awaited: the route changes at once, and the page suspends inside the transition until the issue arrives.
    ctrl.fetchIfStale(IssueResource.get, { id });
    // callout: IssueNotes suspends inside its own boundary, which also shows a failure.
    ctrl.fetchIfStale(getNotes, { issueId: id });
    return null;
  };
```

</DiffEditor>

```tsx title="IssuePage.tsx"
import { AsyncBoundary } from '@data-client/react';
import IssueDetail from './IssueDetail';
import IssueNotes from './IssueNotes';
import Spinner from './Spinner';

export default function IssuePage({ id }: { id: number }) {
  return (
    <>
      <IssueDetail id={id} />
      <AsyncBoundary fallback={<Spinner />}>
        <IssueNotes issueId={id} />
      </AsyncBoundary>
    </>
  );
}
```

- **Qué buscar:** loaders que hacen `await` o `Promise.all()` de varias peticiones; componentes que llaman a `useSuspense()` debajo del
  contenido principal de la página sin un boundary propio.
- **Qué ven los usuarios:** la página aparece mientras las partes secundarias muestran su propio estado de carga.

### Precarga por intención {#prefetch}

- **Qué buscar:** enlaces a páginas cuyos datos el store aún no tiene, en rutas sin loader.
- **Qué cambiar:** llama a `ctrl.fetchIfStale(endpoint, args)` en `onMouseEnter` y `onFocus` del enlace, o añade un loader.
- **Qué ven los usuarios:** la página aparece sin un estado de carga. Los enlaces sobre los que se pasa el cursor pero no se hace clic cuestan una petición.

### La caducidad se ajusta a los datos {#expiry}

Data Client vuelve a obtener los datos más antiguos que el [`dataExpiryLength`](/rest/api/RestEndpoint#dataexpirylength) de su endpoint
(60 segundos por defecto) cuando un componente los lee de nuevo. Las mutaciones que actualizan el store en su lugar mantienen los datos correctos
entre fetches, así que la mayoría de los datos pueden seguir frescos más tiempo.

- **Qué buscar:** `dataExpiryLength: 0`, una caducidad muy corta o `invalidIfStale: true` copiados de un `staleTime: 0` de TanStack Query;
  datos que rara vez cambian, como el usuario actual, los ajustes o las listas de opciones, dejados con el valor por defecto.
- **Qué cambiar:** elimina esas sobrescrituras y aumenta `dataExpiryLength` en los endpoints cuyos datos cambian solo a través de esta
  aplicación.
- **Qué ven los usuarios:** menos refetches en segundo plano y ningún estado de carga al volver a una página. Los cambios hechos en otro lugar
  aparecen más tarde.

### Actualizaciones optimistas {#optimistic}

Cuando el cliente puede predecir el resultado de una mutación, muéstralo al instante y deja que Data Client lo revierta si la petición falla.
Usa [getOptimisticResponse()](/rest/guides/optimistic-updates) en el endpoint, o `optimistic: true` en
[resource()](/rest/api/resource). `optimistic: true` cubre todas las mutaciones, incluidas las creaciones. Hasta que el servidor
responde, un elemento nuevo se almacena bajo una clave temporal aleatoria, pero su `id` y `pk()` conservan el valor por defecto de la Entity (como
`0`), así que usa otra cosa como key de su fila y deshabilita sus otras mutaciones; para hacer optimista una sola mutación, añade
`getOptimisticResponse` solo a ese endpoint con `resource().extend('partialUpdate', { ... })`.

- **Qué buscar:** `ctrl.fetch()` de actualizaciones, eliminaciones y creaciones cuya respuesta el cliente puede predecir a partir del cuerpo y
  el store.
- **Qué ven los usuarios:** los cambios aparecen al hacer clic. Una petición fallida revierte el cambio, así que sigue mostrando su error.

### Vistas derivadas en Query {#query}

- **Qué buscar:** ordenación, filtrado o agrupación de datos obtenidos en el render o en `useMemo()`.
- **Qué cambiar:** haz que una [Query](/rest/api/Query) sea el schema del endpoint y sigue leyéndola con `useSuspense()`
  ([ordenación en el cliente](/rest/guides/sorting-client-side)). Su resultado se memoiza entre componentes y se recalcula
  solo cuando cambian sus entradas. [useQuery()](../api/useQuery.md) nunca hace fetch, así que úsalo solo cuando los datos ya se
  obtienen en otro lugar.
- **Qué ven los usuarios:** ningún cambio; las actualizaciones se renderizan más rápido en listas grandes.

### Lecturas en paralelo {#parallel}

- **Qué buscar:** dos llamadas a `useSuspense()` en un componente donde ninguna necesita los datos de la otra; un hijo que inicia su
  fetch solo después de que lleguen los datos de su padre.
- **Qué cambiar:** inicia ambas con [useFetch()](../api/useFetch.md#parallel-data-loading) y léelas con `use()`, o
  inicia el fetch del hijo en el loader de la ruta. Por debajo de React 19, que no tiene `use()`, llama a `useFetch()` para cada
  endpoint y luego a `useSuspense()` para cada uno; las lecturas reutilizan las peticiones que ya están en curso.
- **Qué ven los usuarios:** la página carga antes.

### Conserva los datos actuales durante los cambios {#transitions}

- **Qué buscar:** paginación, filtros o búsqueda que muestran un destello del fallback de carga.
- **Qué cambiar:** cambia los args dentro de `startTransition()`, o usa [useDebounce()](../api/useDebounce.md) para el texto escrito.
- **Qué ven los usuarios:** los resultados actuales permanecen hasta que los siguientes estén listos.

### Referencias estables {#references}

Data Client mantiene el objeto de cada Entity igual hasta que cambia, así que los componentes memoizados y React Compiler omiten las filas
que no cambiaron.

- **Qué buscar:** entities copiadas o remodeladas en el render (`{ ...issue }`, `issues.map(toViewModel)`) antes de pasarlas a componentes
  hijos.
- **Qué cambiar:** pasa la Entity misma; pon los campos calculados en la clase Entity como getters.
- **Qué ven los usuarios:** ningún cambio; se renderizan menos componentes después de cada actualización.

### React 19 y React Compiler {#compiler}

[React Compiler](https://react.dev/learn/react-compiler) memoiza componentes y hooks en tiempo de compilación. Con las referencias
estables anteriores, se renderizan menos componentes después de una actualización del store.

- **Qué buscar:** `react` por debajo de la 19 en package.json; ningún `babel-plugin-react-compiler` en la compilación (configuración de Babel o Vite,
  `reactCompiler` en la configuración de Next.js, o `experiments.reactCompiler` en el app.json de Expo).
- **Qué cambiar en React 19:** sigue la [guía de instalación](https://react.dev/learn/react-compiler/installation) y activa
  las reglas recomendadas de `eslint-plugin-react-hooks`. El compilador omite los componentes que rompen las
  [Reglas de React](https://react.dev/reference/rules), y las reglas del linter los señalan. Deja la memoización existente
  en su lugar y ejecuta las pruebas.
- **Por debajo de React 19:** actualizar React es un proyecto en sí mismo, así que no lo hagas en esta pasada. Explica qué aporta React 19 a
  esta aplicación: `use()` para las [lecturas en paralelo](#parallel) anteriores y, en la 19.2,
  [`<Activity>`](https://react.dev/reference/react/Activity) para conservar el estado y la salida renderizada de las páginas ocultas. Luego pregunta
  si se actualiza como seguimiento, con la [guía de actualización](https://react.dev/blog/2024/04/25/react-19-upgrade-guide),
  y ofrece añadir el compilador con ella. El compilador también funciona en React 17 y 18 con `react-compiler-runtime`; añádelo
  antes de la actualización solo si el usuario lo pide.
- **Hasta la actualización:** envuelve las filas de lista costosas en `memo()`, de modo que las filas cuya Entity no cambió omitan el renderizado.
- **Qué ven los usuarios:** ningún cambio. El JavaScript compilado es más grande, así que mide también el tiempo de carga.

## Informe {#report}

Para cada sección, registra lo que encontraste, lo que cambiaste u omitiste y por qué, y los números de antes y después.
