---
frameworks: [react]
title: Migrando do TanStack Query para o Reactive Data Client
sidebar_label: Migração do TanStack Query
---

import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrando do TanStack Query

O TanStack Query (React Query) guarda em cache a resposta de cada query key separadamente, então o app as mantém consistentes
invalidando keys após cada mutação. O Reactive Data Client [normaliza](../concepts/normalization.md) as respostas
em [Entities](/rest/api/Entity): a resposta de uma mutação atualiza toda lista e todo detalhe que mostra aquela entity, e
a maior parte do código de invalidação desaparece.

A migração substitui as funções e keys de query por endpoints tipados, os hooks por [useSuspense()](../api/useSuspense.md)
e chamadas ao [Controller](../api/Controller.md), e o `QueryClient` por [DataProvider](../api/DataProvider.md).
[Passos](#steps) dá a ordem; o [mapa de APIs](#api-map) dá a substituição de cada API do TanStack Query.

<SiteOnly>

## Migre com o seu agent de código {#agent}

Cole isto no chat do seu agent:

```prompt
Migrate this app from TanStack Query to Reactive Data Client. Install the setup skill first: `npx skills add reactive/data-client --skill data-client-setup -y`, then read `.agents/skills/data-client-setup/SKILL.md` and follow it.
```

A skill de configuração segue este guia. Revise o diff dela como o de um colega de equipe.

</SiteOnly>

<AgentOnly>

Para migrar um app do TanStack Query, instale a skill de configuração a partir da raiz do projeto e depois leia
`.agents/skills/data-client-setup/SKILL.md` e siga-o:

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

</AgentOnly>

## Passos {#steps}

Mantenha os testes do app passando após cada passo; eles são a prova de que o comportamento não mudou.

1. **Endpoints e schemas.** Transforme cada função de query e de mutação em um endpoint: siga a
   [configuração do REST](/rest) para a biblioteca HTTP que as funções chamam (axios, fetch, ky) e depois dê a cada endpoint um
   `schema` construído a partir de [Entities](/rest/api/Entity). Sem um schema nada é normalizado, e você precisará manter
   todas as chamadas a `invalidateQueries`. Coloque as Entities e os endpoints em uma pasta que toda feature possa importar (como
   `src/resources/`), não na pasta `api/` de cada feature, mesmo quando os hooks de query ficavam lá: uma mutação em uma
   feature costuma atualizar a Entity de outra feature. Se regras de lint restringem imports entre pastas
   (`import/no-restricted-paths`, `eslint-plugin-boundaries`, limites de módulo do Nx), use uma camada compartilhada que elas permitam.
2. **Provider.** Substitua `QueryClientProvider` por `DataProvider` ([Provider](#provider)).
3. **Leituras.** Substitua `useQuery()` e `useSuspenseQuery()` por `useSuspense()` no componente que renderiza os
   dados ([Leituras](#reads)).
4. **Mutações.** Substitua `useMutation()` por `ctrl.fetch()` e apague a invalidação que a normalização torna
   desnecessária ([Mutações](#mutations)).
5. **Loaders e prefetching.** Substitua o `queryClient` em loaders de roteador e no prefetching ao passar o mouse por
   `ctrl.fetchIfStale()` ([Loaders e prefetching](#loaders)).
6. **Infinite queries.** Substitua `useInfiniteQuery()` por uma [Collection](/rest/api/Collection) e `getPage`
   ([Infinite queries](#infinite)).
7. **Auth.** Substitua bibliotecas de autenticação construídas sobre o TanStack Query, como `react-query-auth` ([Auth](#auth)).
8. **Testes.** Substitua `QueryClientProvider` nos wrappers de teste e as suposições sobre spinners de carregamento ([Testes](#tests)).
9. **Limpeza.** Apague as fábricas de query keys, os helpers `queryOptions()` e configurações no estilo `lib/react-query.ts`. Desinstale
   `@tanstack/react-query` e `@tanstack/react-query-devtools` quando nenhum arquivo os importar.

## Mapa de APIs {#api-map}

| TanStack Query | Data Client |
| --- | --- |
| `queryFn` + `queryKey`, `queryOptions()` | Um endpoint com um `schema`. O endpoint e seus args são a key, então as fábricas de keys desaparecem |
| `useQuery()`, `useSuspenseQuery()` | `useSuspense(endpoint, args)`: o carregamento vai para o `<Suspense>` mais próximo, os erros para o error boundary mais próximo, e `data` nunca é `undefined` |
| `useQuery()` em que o componente renderiza o próprio spinner ou erro | [useDLE()](../api/useDLE.md): `{ data, loading, error }` |
| `enabled: false` | `null` no lugar dos args: `useSuspense(endpoint, id ? { id } : null)` retorna `undefined` e não busca nada |
| `select` | Calcule na renderização, ou use um schema [Query](/rest/api/Query) lido com [useQuery()](../api/useQuery.md) |
| `useQueries()` | [useFetch()](../api/useFetch.md) para cada um e depois o `use()` do React: eles fazem fetch em paralelo |
| `staleTime` | [dataExpiryLength](../concepts/expiry-policy.md#endpointdataexpirylength) no endpoint ou na classe base. O padrão é 60 segundos (o do TanStack Query é 0) |
| `gcTime` | o [gcPolicy](../api/DataProvider.md#gcPolicy) do `DataProvider` |
| `retry` | Apague: o Data Client não tem loop de retry. Uma requisição com erro é buscada novamente quando um componente precisa dela após `errorExpiryLength` (padrão de 1 segundo), como o `retry: false` do TanStack Query |
| `refetchInterval` | `pollFrequency` no endpoint, lido com [useLive()](../api/useLive.md) |
| `refetchOnWindowFocus` | Apague: o Data Client não faz novo fetch ao focar a janela |
| `placeholderData: keepPreviousData` | Mude os args dentro de `startTransition()` (ou use [useDebounce()](../api/useDebounce.md) para texto digitado): o React continua mostrando os dados atuais enquanto os próximos carregam |
| `initialData` vindo de uma query de lista | Apague: enquanto os dados da lista estão fresh, uma Entity que ela carregou é renderizada na página de detalhe sem um fetch, quando o schema do endpoint de detalhe é essa Entity |
| `useMutation()` | `ctrl.fetch(endpoint, ...args)` no event handler, a partir de [useController()](../api/useController.md) |
| `isPending` e `error` de uma mutação | [useLoading()](../api/useLoading.md): `const [run, isPending, error] = useLoading(fn, deps)` |
| `isSuccess`, `onSuccess`, `onError` | Código após ou ao redor de `await ctrl.fetch()` ([Mutações](#mutations)) |
| `invalidateQueries()` após uma atualização | Apague, quando a resposta é a Entity atualizada |
| `invalidateQueries()` após uma criação | `ctrl.fetch(Resource.getList.push, body)` (ou `unshift`); páginas numeradas são diferentes ([Mutações](#mutations)) |
| `invalidateQueries()` após uma exclusão | Apague: `resource().delete` (ou um schema `schema.Invalidate`) remove a Entity de toda lista |
| `invalidateQueries()` para dados que a resposta não inclui (contagens, totais) | `ctrl.expireAll(endpoint)`: os componentes montados fazem novo fetch |
| `refetchQueries()` | `ctrl.fetch(endpoint, args)` |
| `setQueryData()` | `ctrl.setResponse(endpoint, args, response)`; para Entities, `ctrl.set(Entity, args, value)` |
| `getQueryData()` | Em um componente, [useCache()](../api/useCache.md). Em outros lugares, `ctrl.get(schema, args, ctrl.getState())` |
| `prefetchQuery()`, `ensureQueryData()`, `getQueryData() ?? fetchQuery()` | `ctrl.fetchIfStale(endpoint, args)` |
| `fetchQuery()` | `ctrl.fetch(endpoint, args)` |
| atualização otimista e rollback com `onMutate` | [getOptimisticResponse()](/rest/guides/optimistic-updates) no endpoint: o Data Client faz rollback em caso de erro |
| `useInfiniteQuery()` | Uma [Collection](/rest/api/Collection) e `ctrl.fetch(endpoint.getPage, args)` ([Infinite queries](#infinite)) |
| `queryClient.clear()`, `removeQueries()` no logout | `ctrl.resetEntireStore()` |
| `QueryClientProvider`, `new QueryClient()` | `DataProvider` |
| `useQueryClient()` | `useController()` |
| `ReactQueryDevtools` | Apague: o `DataProvider` adiciona as [devtools](../getting-started/debugging.md) em desenvolvimento |
| `HydrationBoundary`, `dehydrate()` | [Server Side Rendering](./ssr.md) |

:::warning

O [useQuery()](../api/useQuery.md) do próprio Data Client não é o do TanStack Query. Ele lê um schema do store e nunca
faz fetch. Substitua o `useQuery()` do TanStack Query por `useSuspense()` ou `useDLE()`.

:::

## Provider {#provider}

Coloque o `DataProvider` na raiz, fora dos outros providers e dos limites `<Suspense>` do app, em vez de onde o
`QueryClientProvider` estava. O limite de reserva dele, que mostra "Uncaught Suspense" em desenvolvimento, captura antes de qualquer
limite acima dele.

```tsx title="provider.tsx"
import { DataProvider } from '@data-client/react';
import { Suspense, type ReactNode } from 'react';

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <Suspense fallback={<Loading />}>{children}</Suspense>
  </DataProvider>
);
```

O `DataProvider` cria seu próprio store, então não há client a criar. Mova os `defaultOptions` do `QueryClient` para a classe base
de endpoint, como o [mapa de APIs](#api-map) lista.

## Leituras {#reads}

Chame `useSuspense()` no componente que renderiza os dados e apague o hook `useIssues()` de cada feature que
envolvia `useQuery()`. Dois componentes que pedem o mesmo endpoint e os mesmos args compartilham um fetch e uma entrada no store, então
nada se ganha ao compartilhar um hook, e um hook esconde de que o componente depende.

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

O ramo `isLoading` vai para um fallback de `<Suspense>`, e o ramo `isError` para um error boundary; um
[AsyncBoundary](../api/AsyncBoundary.md) é os dois. Mantenha o skeleton e o banner de erro do próprio app como seus fallbacks. A
guarda `?? []` desaparece, porque `useSuspense()` só retorna quando os dados já estão lá.

Duas chamadas a `useSuspense()` em um componente carregam uma depois da outra. Quando nenhuma precisa dos dados da outra, inicie as duas
com `useFetch()` e leia-as com `use()` ([carregamento paralelo de dados](../api/useFetch.md#parallel-data-loading)).

### Respostas com envelope {#envelope-responses}

Quando a API envolve as respostas, como `{ "results": [...], "pagination": {...} }`, descreva o envelope no schema
em vez de desembrulhá-lo, para que os componentes continuem lendo `pagination`:

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

`searchParams` tipa o argumento `page` da lista. `create` reutiliza o `POST` da lista, com o schema simples `Issue` no
lugar da Collection da lista; [Mutações](#mutations) diz quando usá-lo. Quando os itens individuais
também vêm envolvidos, como `{ "data": {...} }`, estenda `get` da mesma forma: `Base.get.extend({ schema: { data: Issue } })`.

## Mutações {#mutations}

Chame `ctrl.fetch()` onde o app chamava `mutate()`. O que `onSuccess` fazia vai após o `await`; `onError` vai em
um `catch`. Acompanhe o estado pendente e de erro com `useLoading()`.

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

A chamada a `invalidateQueries()` desapareceu: a resposta é a `Issue` atualizada, então a tabela e a página de detalhe
mostram a issue fechada. Apps com TanStack Query costumam invalidar a key de detalhe, mas não todas as keys de lista, então as listas mostram dados
desatualizados até expirarem; após a migração, isso não acontece.

Decida o que fazer com cada chamada a `invalidateQueries()` e `refetchQueries()` a partir da resposta (mais exemplos em
[mutações](../getting-started/mutations.md)):

- **A resposta é a Entity alterada** (update, partial update): apague a chamada, a menos que a alteração mova a Entity
  entre listas filtradas ou ordenadas. Fechar uma issue a atualiza em todo lugar, mas não a remove de uma lista
  `?state=open` em cache nem a adiciona a uma `?state=closed`; mantenha essas corretas com `ctrl.expireAll(Resource.getList)`.
- **Criação**: faça fetch do endpoint `push` (ou `unshift`) da lista em vez do `POST` simples, e a nova Entity entra em todas as
  listas correspondentes. Isso exige uma [Collection](/rest/api/Collection) no schema da lista: `resource()` já tem uma por padrão,
  e um envelope precisa dela por dentro, como `results: new Collection([Issue])`. Para listas divididas em
  páginas numeradas, em que um novo item desloca todas as páginas, adicione um endpoint `POST` simples (`create` no
  [exemplo de envelope](#envelope-responses): `Base.getList.push.extend({ schema: Issue })`) e depois chame
  `ctrl.expireAll(Resource.getList)`.
- **Exclusão**: `resource().delete` remove a Entity de toda lista. Para um endpoint personalizado, use
  `schema: new schema.Invalidate(MyEntity)`. Para listas divididas em páginas numeradas, chame também
  `ctrl.expireAll(Resource.getList)`: os itens posteriores do servidor sobem uma página, o que as páginas em cache não têm como saber.
- **Dados que a resposta não inclui** (uma contagem, os totais de outro resource): `ctrl.expireAll(endpoint)`, ou retorne-os
  na resposta ([efeitos colaterais](/rest/guides/side-effects)).

### Estado de sucesso {#success-state}

`useLoading()` não tem `isSuccess`, e a função que ele retorna nunca é rejeitada: ele guarda o erro. Então feche um
formulário ou diálogo após `await ctrl.fetch()` dentro da função que você passa para `useLoading()`, não depois de chamar a
função retornada. Para manter uma flag de sucesso:

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

## Loaders e prefetching {#loaders}

Os loaders de roteador que recebem o `queryClient` passam a receber o Controller. `useController()` retorna o mesmo
Controller a cada renderização, então é seguro criar o roteador a partir dele.

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

`fetchIfStale()` faz o fetch apenas quando os dados estão ausentes ou desatualizados. Use-o também para prefetching ao passar o mouse ou ao focar:
`onMouseEnter={() => ctrl.fetchIfStale(IssueResource.get, { id })}`. Carregue vários endpoints com `Promise.all()` de
chamadas a `fetchIfStale()`.

## Infinite queries {#infinite}

`useInfiniteQuery()` mantém um array de páginas. O Data Client mantém uma única lista: uma [Collection](/rest/api/Collection) à qual cada
nova página é acrescentada. Defina `paginationField` no endpoint para obter o endpoint `getPage` dele.

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

`argsKey` deixa `page` de fora, então toda página e o endpoint `push` encontram a mesma lista. Uma nova nota aparece sem
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

`pages.flatMap()` desaparece. O que `getNextPageParam` calculava e `hasNextPage` informava vêm da resposta
(`nextPage` aqui), que `getPage` atualiza junto com a lista. `isFetchingNextPage` é a flag de pendente do `useLoading()`.
Para cursores, veja [paginação](/rest/guides/pagination).

## Auth {#auth}

Bibliotecas como `react-query-auth` oferecem `useUser()`, `useLogin()`, `useLogout()` e `AuthLoader` sobre o TanStack
Query. Reconstrua-os a partir de endpoints:

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

Para o cadastro, copie `useSignIn()` como `useSignUp()` com o endpoint de cadastro e o tipo do body dele. `AuthLoader` desaparece: `useAccount()` suspende
no limite `<Suspense>` do app até a sessão carregar. Esses hooks envolvem ações, não um vínculo de dados, então vale
a pena mantê-los como hooks.

Os pontos de chamada mudam de forma:

- `useUser().data` passa a ser o próprio valor: `useAccount()`.
- `useLogin({ onSuccess }).mutate(values)` passa a ser `const [signIn, isPending] = useSignIn(onSuccess)` e depois
  `signIn(values)`.

`useAccount()` precisa que `/session` responda a um visitante desconectado sem conta, como o `userFn` do `react-query-auth` retorna
`null`. Assim as páginas para visitantes desconectados renderizam, e o novo fetch após `resetEntireStore()` mostra o estado desconectado. Se a API
responder 401, o erro chega ao error boundary mais próximo, então transforme esse status em uma resposta de desconectado:

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

Para fazer logout em qualquer outra resposta 401, adicione o [LogoutManager](../api/LogoutManager.md); para o armazenamento de tokens, veja
[autenticação](/rest/guides/auth).

## Testes {#tests}

- Substitua `QueryClientProvider` (e o `new QueryClient()` de cada teste) nos wrappers de teste por `DataProvider`, com
  `<Suspense>` dentro dele. Cada montagem de `DataProvider` começa com um store vazio.
- Helpers que esperam um spinner desaparecer falham quando os dados já estão no store, porque então nada
  suspende. Espere apenas quando houver um spinner:

  ```ts title="test-utils.ts"
  import { screen, waitForElementToBeRemoved } from '@testing-library/react';

  const loadingElements = () => screen.queryAllByTestId(/loading/i);

  export const waitForLoadingToFinish = async () => {
    if (loadingElements().length)
      await waitForElementToBeRemoved(loadingElements);
  };
  ```

- Servidores mock (MSW, `nock`) continuam funcionando sem mudanças. Para renderizar a partir de fixtures sem um servidor, use
  [MockResolver](../api/MockResolver.md).
- Asserções sobre query keys ou sobre o estado do `queryClient` desaparecem; faça asserções sobre o que é renderizado.

## Verifique a migração {#check}

- Nenhum arquivo importa `@tanstack/react-query`, e não resta nenhum `queryKey`, `queryOptions` ou `useQueryClient`.
- Todo endpoint que retorna Entities tem um `schema`.
- O linter passa, incluindo as regras de limite de importação, e nenhuma pasta de feature define uma Entity.
- Cada `<Suspense>` ou `AsyncBoundary` que captura um `useSuspense()` está dentro do `DataProvider`.
- O verificador de tipos, os testes unitários e os testes de ponta a ponta passam.
- Após uma mutação, toda página que mostra aquela Entity mostra a mudança sem recarregar. Um teste que edita um item na
  sua página de detalhe e depois volta para a lista comprova isso.
