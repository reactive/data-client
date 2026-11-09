---
frameworks: [react]
title: Migrar de TanStack Query a Reactive Data Client
sidebar_label: Migración desde TanStack Query
---

import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrar desde TanStack Query

TanStack Query (React Query) guarda en caché la respuesta de cada clave de consulta por separado, así que la aplicación las mantiene consistentes
invalidando claves después de cada mutación. Reactive Data Client [normaliza](../concepts/normalization.md) las respuestas
en [Entities](/rest/api/Entity): la respuesta de una mutación actualiza todas las listas y los detalles que muestran esa entity, y
la mayor parte del código de invalidación desaparece.

La migración sustituye las funciones y las claves de consulta por endpoints con tipos, los hooks por [useSuspense()](../api/useSuspense.md)
y llamadas a [Controller](../api/Controller.md), y el `QueryClient` por [DataProvider](../api/DataProvider.md).
[Pasos](#steps) da el orden; [Mapa de API](#api-map) da el reemplazo de cada API de TanStack Query.

<SiteOnly>

## Migra con tu agente de programación {#agent}

Pega esto en el chat de tu agente:

```prompt
Migrate this app from TanStack Query to Reactive Data Client. Install the setup skill first: `npx skills add reactive/data-client --skill data-client-setup -y`, then read `.agents/skills/data-client-setup/SKILL.md` and follow it.
```

La skill de configuración sigue esta guía. Revisa su diff como el de un compañero de equipo.

</SiteOnly>

<AgentOnly>

Para migrar una aplicación desde TanStack Query, instala la skill de configuración desde la raíz del proyecto, luego lee
`.agents/skills/data-client-setup/SKILL.md` y síguela:

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

</AgentOnly>

## Pasos {#steps}

Mantén las pruebas de la aplicación en verde después de cada paso; son la prueba de que el comportamiento no cambió.

1. **Endpoints y schemas.** Convierte cada función de consulta y de mutación en un endpoint: sigue la
   [configuración de REST](/rest) para la biblioteca HTTP que llaman las funciones (axios, fetch, ky), y luego dale a cada endpoint un
   `schema` construido con [Entities](/rest/api/Entity). Sin un schema nada se normaliza, y tendrás que conservar
   cada llamada a `invalidateQueries`. Pon las Entities y los endpoints en una carpeta que cualquier funcionalidad pueda importar (como
   `src/resources/`), no en la carpeta `api/` de cada funcionalidad, aunque los hooks de consulta vivieran allí: una mutación en una
   funcionalidad suele actualizar la Entity de otra. Si las reglas de lint restringen las importaciones entre carpetas
   (`import/no-restricted-paths`, `eslint-plugin-boundaries`, límites de módulos de Nx), usa una capa compartida que permitan.
2. **Provider.** Sustituye `QueryClientProvider` por `DataProvider` ([Provider](#provider)).
3. **Lecturas.** Sustituye `useQuery()` y `useSuspenseQuery()` por `useSuspense()` en el componente que renderiza los
   datos ([Lecturas](#reads)).
4. **Mutaciones.** Sustituye `useMutation()` por `ctrl.fetch()`, y elimina la invalidación que la normalización hace
   innecesaria ([Mutaciones](#mutations)).
5. **Loaders y precarga.** Sustituye `queryClient` en los loaders del router y en la precarga al pasar el cursor por
   `ctrl.fetchIfStale()` ([Loaders y precarga](#loaders)).
6. **Consultas infinitas.** Sustituye `useInfiniteQuery()` por una [Collection](/rest/api/Collection) y `getPage`
   ([Consultas infinitas](#infinite)).
7. **Autenticación.** Sustituye las bibliotecas de autenticación construidas sobre TanStack Query, como `react-query-auth` ([Autenticación](#auth)).
8. **Pruebas.** Sustituye `QueryClientProvider` en los wrappers de prueba y las suposiciones sobre indicadores de carga ([Pruebas](#tests)).
9. **Limpieza.** Elimina las fábricas de claves de consulta, los helpers de `queryOptions()` y la configuración al estilo `lib/react-query.ts`. Desinstala
   `@tanstack/react-query` y `@tanstack/react-query-devtools` cuando ningún archivo los importe.

## Mapa de API {#api-map}

| TanStack Query | Data Client |
| --- | --- |
| `queryFn` + `queryKey`, `queryOptions()` | Un endpoint con un `schema`. El endpoint y sus args son la clave, así que las fábricas de claves desaparecen |
| `useQuery()`, `useSuspenseQuery()` | `useSuspense(endpoint, args)`: la carga va al `<Suspense>` más cercano, los errores al error boundary más cercano, y `data` nunca es `undefined` |
| `useQuery()` donde el componente renderiza su propio indicador de carga o error | [useDLE()](../api/useDLE.md): `{ data, loading, error }` |
| `enabled: false` | `null` en lugar de los args: `useSuspense(endpoint, id ? { id } : null)` devuelve `undefined` y no hace fetch de nada |
| `select` | Calcúlalo al renderizar, o un schema [Query](/rest/api/Query) leído con [useQuery()](../api/useQuery.md) |
| `useQueries()` | [useFetch()](../api/useFetch.md) para cada uno, y luego `use()` de React: hacen fetch en paralelo |
| `staleTime` | [dataExpiryLength](../concepts/expiry-policy.md#endpointdataexpirylength) en el endpoint o en la clase base. El valor predeterminado es 60 segundos (el de TanStack Query es 0) |
| `gcTime` | [gcPolicy](../api/DataProvider.md#gcPolicy) de `DataProvider` |
| `retry` | Elimínalo: Data Client no tiene un bucle de reintentos. Una petición con error se vuelve a obtener cuando un componente la necesita después de `errorExpiryLength` (1 segundo por defecto), como el `retry: false` de TanStack Query |
| `refetchInterval` | `pollFrequency` en el endpoint, leído con [useLive()](../api/useLive.md) |
| `refetchOnWindowFocus` | Elimínalo: Data Client no vuelve a obtener los datos al enfocar la ventana |
| `placeholderData: keepPreviousData` | Cambia los args dentro de `startTransition()` (o [useDebounce()](../api/useDebounce.md) para texto escrito): React sigue mostrando los datos actuales mientras se cargan los siguientes |
| `initialData` de una consulta de lista | Elimínalo: mientras los datos de la lista están frescos, una Entity que cargó se renderiza en la página de detalle sin hacer fetch, cuando el schema del endpoint de detalle es esa Entity |
| `useMutation()` | `ctrl.fetch(endpoint, ...args)` en el manejador de eventos, desde [useController()](../api/useController.md) |
| `isPending`, `error` de una mutación | [useLoading()](../api/useLoading.md): `const [run, isPending, error] = useLoading(fn, deps)` |
| `isSuccess`, `onSuccess`, `onError` | Código después de `await ctrl.fetch()` o a su alrededor ([Mutaciones](#mutations)) |
| `invalidateQueries()` después de una actualización | Elimínalo, cuando la respuesta es la Entity actualizada |
| `invalidateQueries()` después de una creación | `ctrl.fetch(Resource.getList.push, body)` (o `unshift`); las páginas numeradas son distintas ([Mutaciones](#mutations)) |
| `invalidateQueries()` después de una eliminación | Elimínalo: `resource().delete` (o un schema `schema.Invalidate`) quita la Entity de todas las listas |
| `invalidateQueries()` para datos que la respuesta no incluye (conteos, totales) | `ctrl.expireAll(endpoint)`: los componentes montados vuelven a hacer fetch |
| `refetchQueries()` | `ctrl.fetch(endpoint, args)` |
| `setQueryData()` | `ctrl.setResponse(endpoint, args, response)`; para Entities, `ctrl.set(Entity, args, value)` |
| `getQueryData()` | En un componente, [useCache()](../api/useCache.md). En otros lugares, `ctrl.get(schema, args, ctrl.getState())` |
| `prefetchQuery()`, `ensureQueryData()`, `getQueryData() ?? fetchQuery()` | `ctrl.fetchIfStale(endpoint, args)` |
| `fetchQuery()` | `ctrl.fetch(endpoint, args)` |
| Actualización optimista y reversión con `onMutate` | [getOptimisticResponse()](/rest/guides/optimistic-updates) en el endpoint: Data Client revierte en caso de error |
| `useInfiniteQuery()` | Una [Collection](/rest/api/Collection) y `ctrl.fetch(endpoint.getPage, args)` ([Consultas infinitas](#infinite)) |
| `queryClient.clear()`, `removeQueries()` al cerrar sesión | `ctrl.resetEntireStore()` |
| `QueryClientProvider`, `new QueryClient()` | `DataProvider` |
| `useQueryClient()` | `useController()` |
| `ReactQueryDevtools` | Elimínalo: `DataProvider` añade las [devtools](../getting-started/debugging.md) en desarrollo |
| `HydrationBoundary`, `dehydrate()` | [Renderizado del lado del servidor](./ssr.md) |

:::warning

Data Client's own [useQuery()](../api/useQuery.md) is not TanStack Query's. It reads a schema from the store and never
fetches. Replace TanStack Query's `useQuery()` with `useSuspense()` or `useDLE()`.

:::

## Provider {#provider}

Pon `DataProvider` en la raíz, fuera de los demás providers de la aplicación y de los límites `<Suspense>`, en lugar de donde estaba
`QueryClientProvider`. Su límite de respaldo, que muestra "Uncaught Suspense" en desarrollo, captura antes que cualquier
límite que esté por encima.

```tsx title="provider.tsx"
import { DataProvider } from '@data-client/react';
import { Suspense, type ReactNode } from 'react';

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <Suspense fallback={<Loading />}>{children}</Suspense>
  </DataProvider>
);
```

`DataProvider` crea su propio store, así que no hay ningún cliente que crear. Mueve los `defaultOptions` de `QueryClient` a la clase base
de endpoint, como indica el [mapa de API](#api-map).

## Lecturas {#reads}

Llama a `useSuspense()` en el componente que renderiza los datos, y elimina el hook `useIssues()` de cada funcionalidad que
envolvía `useQuery()`. Dos componentes que piden el mismo endpoint y args comparten un único fetch y una única entrada en el store, así que
compartir un hook no aporta nada, y un hook oculta de qué depende el componente.

```ts title="Before"
export const issueKeys = {
  all: ['issues'] as const,
  list: (page: number) => [...issueKeys.all, 'list', page] as const,
  detail: (id: number) => [...issueKeys.all, 'detail', id] as const,
};

export const useIssues = (page: number) =>
  useQuery({ queryKey: issueKeys.list(page), queryFn: () => fetchIssues(page) });
```

```tsx title="Before, in IssueTable" nocheck
const { data, isLoading, isError } = useIssues(page);
if (isLoading) return <TableSkeleton />;
if (isError) return <ErrorBanner />;
return <Table rows={data?.results ?? []} />;
```

```tsx title="After"
import { useSuspense } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export function IssueTable({ page }: { page: number }) {
  const { results: issues, pagination } = useSuspense(IssueResource.getList, {
    page,
  });
  return (
    <table>
      <caption>
        Page {pagination.page} of {pagination.pageCount}
      </caption>
      <tbody>
        {issues.map(issue => (
          <tr key={issue.id}>
            <td>{issue.title}</td>
            <td>{issue.state}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

La rama `isLoading` pasa al fallback de un `<Suspense>`, y la rama `isError` a un error boundary; un
[AsyncBoundary](../api/AsyncBoundary.md) es ambos. Conserva el esqueleto y el banner de error de la propia aplicación como sus fallbacks. La
protección `?? []` desaparece, porque `useSuspense()` solo devuelve un valor cuando los datos ya están.

Dos llamadas a `useSuspense()` en un mismo componente cargan una detrás de otra. Cuando ninguna necesita los datos de la otra, inicia ambas
con `useFetch()` y léelas con `use()` ([carga de datos en paralelo](../api/useFetch.md#parallel-data-loading)).

### Respuestas con envoltorio {#envelope-responses}

Cuando la API envuelve las respuestas, como `{ "results": [...], "pagination": {...} }`, describe el envoltorio en el schema
en lugar de desenvolverlo, para que los componentes sigan leyendo `pagination`:

```ts title="resources/Issue.ts"
import { Entity, resource } from '@data-client/rest';

export class Issue extends Entity {
  id = 0;
  title = '';
  state: 'open' | 'closed' = 'open';
  assignee = '';

  static key = 'Issue';
}

interface Pagination {
  page: number;
  pageCount: number;
}

export const IssueResource = resource({
  path: '/issues/:id',
  searchParams: {} as { page?: number },
  schema: Issue,
}).extend(Base => ({
  getList: Base.getList.extend({
    schema: { results: [Issue], pagination: {} as Pagination },
  }),
  // a new issue shifts every numbered page, so this POST joins no list: callers expire it
  create: Base.getList.push.extend({ schema: Issue }),
}));
```

`searchParams` tipa el argumento `page` de la lista. `create` reutiliza el `POST` de la lista, con el schema simple `Issue` en
lugar de la Collection de la lista; [Mutaciones](#mutations) explica cuándo usarlo. Cuando los elementos individuales
también vienen envueltos, como `{ "data": {...} }`, extiende `get` del mismo modo: `Base.get.extend({ schema: { data: Issue } })`.

## Mutaciones {#mutations}

Llama a `ctrl.fetch()` donde la aplicación llamaba a `mutate()`. Lo que hacía `onSuccess` va después del `await`; `onError` va en
un `catch`. Sigue el estado pendiente y de error con `useLoading()`.

```ts title="Before"
export const useCloseIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patchIssue(id, { state: 'closed' }),
    onSuccess: issue => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issue.id) });
      toast(`Closed #${issue.id}`);
    },
    onError: () => toast('Could not close the issue'),
  });
};
```

```tsx title="After"
import { useController, useLoading } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export function CloseIssueButton({ id }: { id: number }) {
  const ctrl = useController();
  const [close, isPending] = useLoading(async () => {
    try {
      await ctrl.fetch(IssueResource.partialUpdate, { id }, { state: 'closed' });
      toast(`Closed #${id}`);
    } catch {
      toast('Could not close the issue');
    }
  }, [ctrl, id]);
  return (
    <button onClick={close} disabled={isPending}>
      Close issue
    </button>
  );
}
```

La llamada a `invalidateQueries()` desaparece: la respuesta es el `Issue` actualizado, así que la tabla y la página de detalle
lo muestran cerrado. Las aplicaciones con TanStack Query suelen invalidar la clave del detalle pero no todas las claves de lista, así que las listas muestran datos
obsoletos hasta que caducan; tras la migración ya no ocurre.

Decide qué hacer con cada llamada a `invalidateQueries()` y `refetchQueries()` según la respuesta (más ejemplos en
[mutaciones](../getting-started/mutations.md)):

- **La respuesta es la Entity modificada** (actualización, actualización parcial): elimina la llamada, a menos que el cambio mueva la Entity
  entre listas filtradas u ordenadas. Cerrar un issue lo actualiza en todas partes, pero no lo quita de una lista
  `?state=open` en caché ni lo añade a una `?state=closed`; mantenlas correctas con `ctrl.expireAll(Resource.getList)`.
- **Creación**: haz fetch del endpoint `push` (o `unshift`) de la lista en lugar del `POST` simple, y la nueva Entity se une a todas las
  listas que correspondan. Esto necesita una [Collection](/rest/api/Collection) en el schema de la lista: `resource()` la tiene por defecto,
  y un envoltorio la necesita dentro, como `results: new Collection([Issue])`. Para las listas divididas en
  páginas numeradas, donde un elemento nuevo desplaza todas las páginas, añade un endpoint `POST` simple (`create` en el
  [ejemplo del envoltorio](#envelope-responses): `Base.getList.push.extend({ schema: Issue })`), y luego llama a
  `ctrl.expireAll(Resource.getList)`.
- **Eliminación**: `resource().delete` quita la Entity de todas las listas. Para un endpoint personalizado, usa
  `schema: new schema.Invalidate(MyEntity)`. Para las listas divididas en páginas numeradas, llama también a
  `ctrl.expireAll(Resource.getList)`: los elementos posteriores del servidor suben una página, algo que las páginas en caché no pueden saber.
- **Datos que la respuesta no incluye** (un conteo, los totales de otro recurso): `ctrl.expireAll(endpoint)`, o devuélvelos
  en la respuesta ([efectos secundarios](/rest/guides/side-effects)).

### Estado de éxito {#success-state}

`useLoading()` no tiene `isSuccess`, y la función que devuelve nunca es rechazada: guarda el error en su lugar. Por eso cierra un
formulario o un diálogo después de `await ctrl.fetch()` dentro de la función que pasas a `useLoading()`, no después de llamar a la
función devuelta. Para conservar un indicador de éxito:

```ts title="useMutate.ts"
import { useLoading } from '@data-client/react';
import { useState } from 'react';

export function useMutate<A extends unknown[]>(
  mutate: (...args: A) => Promise<unknown>,
  deps: readonly unknown[],
) {
  const [isDone, setIsDone] = useState(false);
  const [run, isPending, error] = useLoading(async (...args: A) => {
    setIsDone(false);
    await mutate(...args);
    setIsDone(true);
  }, deps);
  return { run, isPending, error, isDone };
}
```

## Loaders y precarga {#loaders}

Los loaders del router que reciben el `queryClient` reciben el Controller en su lugar. `useController()` devuelve el mismo
Controller en cada renderizado, así que es seguro crear el router a partir de él.

```ts title="Before"
export const issueLoader =
  (queryClient: QueryClient) =>
  ({ params }: LoaderFunctionArgs) =>
    queryClient.ensureQueryData({
      queryKey: issueKeys.detail(Number(params.issueId)),
      queryFn: () => fetchIssue(Number(params.issueId)),
    });
```

```ts title="After"
import type { Controller } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) =>
    ctrl.fetchIfStale(IssueResource.get, { id: Number(params.issueId) });
```

`fetchIfStale()` hace fetch solo cuando los datos faltan o están obsoletos. Úsalo también para precargar al pasar el cursor o al enfocar:
`onMouseEnter={() => ctrl.fetchIfStale(IssueResource.get, { id })}`. Carga varios endpoints con `Promise.all()` de
llamadas a `fetchIfStale()`.

## Consultas infinitas {#infinite}

`useInfiniteQuery()` mantiene un array de páginas. Data Client mantiene una sola lista: una [Collection](/rest/api/Collection) a la que cada
página nueva se añade. Define `paginationField` en el endpoint para obtener su endpoint `getPage`.

```ts title="resources/Note.ts"
import { Collection, Entity, RestEndpoint } from '@data-client/rest';

export class Note extends Entity {
  id = 0;
  text = '';
  author = '';

  static key = 'Note';
}

// every page of one issue's notes shares one list
const issueNotes = new Collection([Note], {
  argsKey: ({ issueId }: { issueId: number }) => ({ issueId }),
});

export const getNotes = new RestEndpoint({
  path: '/issues/:issueId/notes',
  searchParams: {} as { page?: number },
  schema: { results: issueNotes, nextPage: 0 as number | null },
  paginationField: 'page',
});

export const addNote = new RestEndpoint({
  path: '/issues/:issueId/notes',
  method: 'POST',
  body: {} as { text: string },
  schema: issueNotes.push,
});
```

`argsKey` omite `page`, así que todas las páginas y el endpoint `push` encuentran la misma lista. Una nota nueva aparece sin
invalidar nada.

```tsx title="IssueNotes.tsx"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { getNotes } from './resources/Note';

export function IssueNotes({ issueId }: { issueId: number }) {
  const { results: notes, nextPage } = useSuspense(getNotes, { issueId });
  const ctrl = useController();
  const [loadMore, isLoadingMore] = useLoading(
    async (page: number) => ctrl.fetch(getNotes.getPage, { issueId, page }),
    [ctrl, issueId],
  );
  return (
    <>
      <ul>
        {notes.map(note => (
          <li key={note.id}>
            {note.author}: {note.text}
          </li>
        ))}
      </ul>
      {nextPage !== null && (
        <button onClick={() => loadMore(nextPage)} disabled={isLoadingMore}>
          Show older notes
        </button>
      )}
    </>
  );
}
```

`pages.flatMap()` desaparece. Lo que calculaba `getNextPageParam` y lo que informaba `hasNextPage` provienen de la respuesta
(`nextPage` aquí), que `getPage` actualiza junto con la lista. `isFetchingNextPage` es el indicador de estado pendiente de `useLoading()`.
Para los cursores, consulta la [paginación](/rest/guides/pagination).

## Autenticación {#auth}

Bibliotecas como `react-query-auth` ofrecen `useUser()`, `useLogin()`, `useLogout()` y `AuthLoader` sobre TanStack
Query. Reconstrúyelos a partir de endpoints:

```ts title="session.ts"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { Entity, RestEndpoint } from '@data-client/rest';

class Account extends Entity {
  id = '';
  displayName = '';

  static key = 'Account';
}

const getSession = new RestEndpoint({
  path: '/session',
  schema: { account: Account },
});
const signIn = new RestEndpoint({
  path: '/session',
  method: 'POST',
  body: {} as { username: string; password: string },
  schema: { account: Account, token: '' },
});
const signOut = new RestEndpoint({ path: '/session', method: 'DELETE' });

export const useAccount = () => useSuspense(getSession).account;

export const useSignIn = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(
    async (body: { username: string; password: string }) => {
      const { account } = await ctrl.fetch(signIn, body);
      // the signed-in account becomes the current one without refetching
      await ctrl.setResponse(getSession, { account });
      onSuccess?.();
    },
    [ctrl, onSuccess],
  );
};

export const useSignOut = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(async () => {
    await ctrl.fetch(signOut);
    await ctrl.resetEntireStore();
    onSuccess?.();
  }, [ctrl, onSuccess]);
};
```

Para el registro, copia `useSignIn()` como `useSignUp()` con el endpoint de registro y el tipo de su body. `AuthLoader` desaparece: `useAccount()` se suspende
hasta el límite `<Suspense>` de la aplicación hasta que se carga la sesión. Estos hooks envuelven acciones, no un enlace de datos, así que
conviene conservarlos como hooks.

Los puntos de uso cambian de forma:

- `useUser().data` pasa a ser el valor en sí: `useAccount()`.
- `useLogin({ onSuccess }).mutate(values)` pasa a ser `const [signIn, isPending] = useSignIn(onSuccess)`, y luego
  `signIn(values)`.

`useAccount()` necesita que `/session` responda a un visitante sin sesión iniciada sin cuenta, como hace el `userFn` de `react-query-auth`, que devuelve
`null`. Así se renderizan las páginas sin sesión, y el nuevo fetch tras `resetEntireStore()` muestra el estado sin sesión. Si la API
responde 401 en su lugar, el error llega al error boundary más cercano, así que convierte ese estado en una respuesta de sesión no iniciada:

```ts title="getSession.ts"
import { Entity, NetworkError, RestEndpoint } from '@data-client/rest';

class Account extends Entity {
  id = '';
  displayName = '';

  static key = 'Account';
}

export const getSession = new RestEndpoint({
  path: '/session',
  schema: { account: Account },
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    const response = await fetch(input, init);
    if (response.status === 401) {
      // parseResponse() reads JSON only when the Content-Type says so
      return new Response(JSON.stringify({ account: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) throw new NetworkError(response);
    return response;
  },
});
```

Para cerrar la sesión ante cualquier otra respuesta 401, añade [LogoutManager](../api/LogoutManager.md); para el almacenamiento de tokens, consulta la
[autenticación](/rest/guides/auth).

## Pruebas {#tests}

- Sustituye `QueryClientProvider` (y el `new QueryClient()` de cada prueba) en los wrappers de prueba por `DataProvider`, con
  `<Suspense>` dentro. Cada montaje de `DataProvider` empieza con un store vacío.
- Los helpers que esperan a que desaparezca un indicador de carga fallan cuando los datos ya están en el store, porque entonces nada
  se suspende. Espera solo cuando haya un indicador de carga presente:

  ```ts title="test-utils.ts"
  import { screen, waitForElementToBeRemoved } from '@testing-library/react';

  const loadingElements = () => screen.queryAllByTestId(/loading/i);

  export const waitForLoadingToFinish = async () => {
    if (loadingElements().length)
      await waitForElementToBeRemoved(loadingElements);
  };
  ```

- Los servidores simulados (MSW, `nock`) siguen funcionando sin cambios. Para renderizar a partir de fixtures sin un servidor, usa
  [MockResolver](../api/MockResolver.md).
- Las aserciones sobre claves de consulta o sobre el estado de `queryClient` desaparecen; haz aserciones sobre lo que se renderiza.

## Comprueba la migración {#check}

- Ningún archivo importa `@tanstack/react-query`, y no queda ningún `queryKey`, `queryOptions` ni `useQueryClient`.
- Todo endpoint que devuelve Entities tiene un `schema`.
- El linter pasa, incluidas sus reglas de límites de importación, y ninguna carpeta de funcionalidad define una Entity.
- Cada `<Suspense>` o `AsyncBoundary` que captura un `useSuspense()` está dentro de `DataProvider`.
- El comprobador de tipos, las pruebas unitarias y las pruebas de extremo a extremo pasan.
- Después de una mutación, toda página que muestra esa Entity muestra el cambio sin recargar. Una prueba que edita un elemento en
  su página de detalle y luego vuelve a la lista lo demuestra.
