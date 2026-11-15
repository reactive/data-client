---
frameworks: [react]
title: Passada de desempenho
sidebar_label: Passada de desempenho
description: Encontre os ganhos de velocidade que um app com o Data Client pode estar deixando passar, como páginas de detalhe a partir de dados de listas, loaders que não esperam por dados secundários e atualizações otimistas.
---

import DiffEditor from '@site/src/components/DiffEditor';

# Passada de desempenho

O Data Client pode deixar um app mais rápido do que uma migração simples mostra. Execute esta passada depois de uma migração, ou a qualquer momento em um
app que já use o Data Client.

Uma migração já deve entregar os [ganhos embutidos](#built-in): eles exigem pouco código e corrigem comportamentos desatualizados ou lentos,
então verifique se estão no lugar e corrija os que estiverem faltando. As [mudanças com contrapartidas](#tradeoffs) exigem código
extra ou mudam o que os usuários veem, como quando um estado de carregamento aparece ou quando uma mudança surge. Elas formam uma etapa separada e
opcional: faça-as uma de cada vez, mantenha os testes passando e pule as que você não quiser.

## Meça primeiro {#measure}

Registre uma linha de base antes de mudar qualquer coisa e meça de novo após cada mudança:

- **Requisições:** no painel Network do navegador, conte as leituras em cada navegação e após cada mutação.
- **Tempo até atualizar:** no painel Performance, o tempo entre um clique e a tela mostrar seu resultado, não apenas
  a próxima pintura. Limite a CPU e adicione latência de rede para que os números se pareçam com os de dispositivos reais.
- **Renderizações:** o Profiler do React DevTools mostra quais componentes renderizam após uma atualização.

Sem um navegador, conte as requisições que cada fluxo faz a partir do código e dos seus testes, e diga como você contou.

## Ganhos embutidos {#built-in}

### Detalhes a partir de listas {#list-detail}

Um endpoint de detalhe cujo schema contém a [Entity](/rest/api/Entity) da lista renderiza um item que a lista já carregou,
sem fetch, enquanto esses dados estiverem atualizados. A busca usa os args do endpoint, então eles devem usar o nome de campo que o
`pk()` da Entity lê (`{ id }`, não `{ issueId }`), ou um campo em seus [indexes](/rest/api/Entity#indexes).

- **Encontre:** endpoints de detalhe sem schema, ou com um schema que deixa a Entity de fora; args de detalhe que não nomeiam
  nem a chave primária nem um index (`{ slug }` sem `static indexes = ['slug']`); dados da lista copiados para o
  detalhe à mão.
- **Mude:** defina o schema do detalhe como a Entity, ou como um objeto que a contenha, como `{ data: Issue }`. Para outros campos de
  busca, adicione um index em vez de renomear os args. Apague a cópia. Quando a lista retorna menos campos que o
  detalhe, dê à lista uma Entity de resumo, e faça a Entity do detalhe estendê-la com a mesma `key` e um
  `validate()`, para que o detalhe ainda busque o item completo ([entities parciais](/rest/guides/partial-entities)).
- **Os usuários veem:** a página de detalhe aparece na hora quando aberta a partir da lista. Ela não faz nenhuma requisição enquanto a lista estiver atualizada
  e tiver todos os campos que o detalhe exige.

### Uma Entity em todo lugar {#entities}

Todo lugar que mostra um objeto do servidor lê a mesma Entity, então uma resposta atualiza todos eles.

- **Encontre:** campos de Entity que contêm objetos com id próprio mas sem uma entrada em [`static schema`](/rest/api/Entity#schema);
  duas classes Entity com keys diferentes para o mesmo objeto do servidor (uma Entity de resumo que a Entity de detalhe estende
  com a mesma `key` não tem problema); endpoints de atualização sem schema; `ctrl.expireAll()`,
  `ctrl.invalidate()` ou um refetch após uma atualização.
- **Mude:** aninhe a Entity em `static schema` (`{ author: User, labels: [Label] }`), dê aos endpoints de atualização a
  Entity como schema e apague o refetch.
- **Os usuários veem:** uma edição aparece em toda linha, card e detalhe de uma vez, sem requisição.

### Mutações atualizam listas no lugar {#lists}

- **Encontre:** `ctrl.expireAll()`, `ctrl.invalidate()` ou um refetch de uma lista após uma criação, uma exclusão ou uma mudança que
  move um item entre listas filtradas.
- **Mude:** crie por meio do endpoint `push` ou `unshift` da [Collection](/rest/api/Collection) da lista; exclua com
  `resource().delete` ou um schema [Invalidate](/rest/api/Invalidate); mova com o endpoint
  [`move`](/rest/api/RestEndpoint#move) da Collection. Mantenha `expireAll()` para páginas numeradas, cujos itens posteriores se deslocam; para
  listas cuja ordem ou composição o servidor decide; e para dados que a resposta não inclui, como contagens e
  totais.
- **Os usuários veem:** o item novo, removido ou movido aparece sem recarregar a lista.

### Leituras ignoram dados atualizados {#fetch-if-stale}

- **Encontre:** `useEffect()` que faz fetch; `ctrl.fetch()` de um endpoint de leitura em loaders de rota ou handlers de prefetch.
- **Mude:** os componentes leem com `useSuspense()` ou [useFetch()](../api/useFetch.md). Apenas o código em que hooks não podem
  rodar, como loaders de rota e prefetch ao passar o mouse, chama `ctrl.fetchIfStale()`. `ctrl.fetch()` sempre faz a requisição, mesmo
  quando o store tem dados atualizados, então use-o apenas onde o usuário pede uma atualização.
- **Os usuários veem:** nenhuma mudança; menos requisições por navegação.

## Mudanças com contrapartidas {#tradeoffs}

### Loaders não esperam por dados secundários {#loaders}

Um loader de roteador que aguarda todas as requisições faz a página esperar pela mais lenta, mesmo quando o item principal veio
da lista. Em um roteador que muda a rota em uma transition, inicie cada `fetchIfStale()` sem aguardá-lo: a página
renderiza o que está em cache e suspende pelo restante, mantendo a página atual nesse meio-tempo. Dê a cada componente que lê
dados secundários o seu próprio [AsyncBoundary](../api/AsyncBoundary.md), para que carregue sem segurar a página. Quando a página
renderiza o valor de retorno do loader, retorne apenas o item principal, como mostram os [Route loaders](../api/Controller.md#fetchIfStale-loaders).

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

- **Encontre:** loaders que usam `await` ou `Promise.all()` em várias requisições; componentes que chamam `useSuspense()` abaixo do
  conteúdo principal da página sem um boundary próprio.
- **Os usuários veem:** a página aparece enquanto as partes secundárias mostram o seu próprio estado de carregamento.

### Prefetch por intenção {#prefetch}

- **Encontre:** links para páginas cujos dados o store ainda não tem, em rotas sem loader.
- **Mude:** chame `ctrl.fetchIfStale(endpoint, args)` no `onMouseEnter` e no `onFocus` do link, ou adicione um loader.
- **Os usuários veem:** a página aparece sem estado de carregamento. Links sobre os quais se passa o mouse, mas que não são clicados, custam uma requisição.

### A expiração se ajusta aos dados {#expiry}

O Data Client refaz o fetch de dados mais antigos que o [`dataExpiryLength`](/rest/api/RestEndpoint#dataexpirylength) do seu endpoint
(60 segundos por padrão) quando um componente os lê em seguida. Mutações que atualizam o store no lugar mantêm os dados corretos
entre os fetches, então a maioria dos dados pode permanecer atualizada por mais tempo.

- **Encontre:** `dataExpiryLength: 0`, expiração muito curta ou `invalidIfStale: true` copiados de um `staleTime: 0` do TanStack Query;
  dados que raramente mudam, como o usuário atual, configurações ou listas de opções, deixados no padrão.
- **Mude:** remova essas sobrescritas e aumente o `dataExpiryLength` nos endpoints cujos dados mudam apenas por meio deste
  app.
- **Os usuários veem:** menos refetches em segundo plano e nenhum estado de carregamento ao voltar a uma página. Mudanças feitas em outro lugar
  aparecem mais tarde.

### Atualizações otimistas {#optimistic}

Quando o cliente consegue prever o resultado de uma mutação, mostre-o na hora e deixe o Data Client fazer o rollback se a requisição falhar.
Use [getOptimisticResponse()](/rest/guides/optimistic-updates) no endpoint, ou `optimistic: true` em
[resource()](/rest/api/resource). `optimistic: true` cobre toda mutação, incluindo criações. Até o servidor
responder, um novo item é armazenado sob uma key temporária aleatória, mas seu `id` e `pk()` mantêm o padrão da Entity (como
`0`), então use outra coisa como key da sua linha e desabilite as outras mutações dele; para tornar uma mutação otimista, adicione
`getOptimisticResponse` apenas a esse endpoint com `resource().extend('partialUpdate', { ... })`.

- **Encontre:** `ctrl.fetch()` de atualizações, exclusões e criações cuja resposta o cliente consegue prever a partir do corpo e
  do store.
- **Os usuários veem:** as mudanças aparecem no clique. Uma requisição com falha reverte a mudança, então continue mostrando o erro.

### Visões derivadas em Query {#query}

- **Encontre:** ordenação, filtragem ou agrupamento de dados buscados na renderização ou em `useMemo()`.
- **Mude:** faça de uma [Query](/rest/api/Query) o schema do endpoint e continue lendo com `useSuspense()`
  ([ordenação no cliente](/rest/guides/sorting-client-side)). Seu resultado é memoizado entre componentes e é recalculado
  apenas quando suas entradas mudam. O [useQuery()](../api/useQuery.md) nunca faz fetch, então use-o apenas onde os dados já foram
  buscados em outro lugar.
- **Os usuários veem:** nenhuma mudança; as atualizações renderizam mais rápido em listas grandes.

### Leituras em paralelo {#parallel}

- **Encontre:** duas chamadas a `useSuspense()` em um componente em que nenhuma precisa dos dados da outra; um filho que só inicia seu
  fetch depois que os dados do pai chegam.
- **Mude:** inicie ambas com [useFetch()](../api/useFetch.md#parallel-data-loading) e leia-as com `use()`, ou
  inicie o fetch do filho no loader de rota. Abaixo do React 19, que não tem `use()`, chame `useFetch()` para cada
  endpoint e depois `useSuspense()` para cada um; as leituras reutilizam as requisições já em andamento.
- **Os usuários veem:** a página carrega mais cedo.

### Mantenha os dados atuais durante mudanças {#transitions}

- **Encontre:** paginação, filtros ou busca que fazem um fallback de carregamento piscar.
- **Mude:** altere os args dentro de `startTransition()`, ou use [useDebounce()](../api/useDebounce.md) para texto digitado.
- **Os usuários veem:** os resultados atuais permanecem até os próximos ficarem prontos.

### Referências estáveis {#references}

O Data Client mantém o objeto de cada Entity o mesmo até que ele mude, então componentes memoizados e o React Compiler pulam as linhas
que não mudaram.

- **Encontre:** entities copiadas ou remodeladas na renderização (`{ ...issue }`, `issues.map(toViewModel)`) antes de irem para componentes
  filhos.
- **Mude:** passe a própria Entity; coloque os campos calculados na classe da Entity como getters.
- **Os usuários veem:** nenhuma mudança; menos componentes renderizam após cada atualização.

### React 19 e React Compiler {#compiler}

O [React Compiler](https://react.dev/learn/react-compiler) memoiza componentes e hooks em tempo de build. Com as referências
estáveis acima, menos componentes renderizam após uma atualização do store.

- **Encontre:** `react` abaixo do 19 no package.json; nenhum `babel-plugin-react-compiler` no build (configuração do Babel ou do Vite,
  `reactCompiler` na configuração do Next.js, ou `experiments.reactCompiler` no app.json do Expo).
- **Mudança no React 19:** siga o [guia de instalação](https://react.dev/learn/react-compiler/installation) e ative
  as regras recomendadas do `eslint-plugin-react-hooks`. O compiler pula componentes que quebram as
  [Regras do React](https://react.dev/reference/rules), e as regras do lint os apontam. Deixe a memoização existente
  no lugar e execute os testes.
- **Abaixo do React 19:** atualizar o React é um projeto à parte, então não o faça nesta passada. Explique o que o React 19 traz
  para este app: `use()` para as [leituras em paralelo](#parallel) acima e, no 19.2,
  [`<Activity>`](https://react.dev/reference/react/Activity) para manter o estado e a saída renderizada de páginas ocultas. Depois pergunte
  se deve atualizar como um acompanhamento, com o [guia de atualização](https://react.dev/blog/2024/04/25/react-19-upgrade-guide),
  e ofereça-se para adicionar o compiler junto. O compiler também roda no React 17 e 18 com `react-compiler-runtime`; adicione-o
  antes da atualização apenas se o usuário pedir.
- **Até a atualização:** envolva linhas de lista caras em `memo()`, para que as linhas cuja Entity não mudou pulem a renderização.
- **Os usuários veem:** nenhuma mudança. O JavaScript compilado é maior, então meça também o tempo de carregamento.

## Relatório {#report}

Para cada seção, registre o que você encontrou, o que mudou ou pulou e por quê, e os números de antes e depois.
