---
title: Depuração no navegador
---

Depure o estado e as actions do :react[`@data-client/react`]:vue[`@data-client/vue`] de forma programática, a partir de qualquer ferramenta de navegador que execute JavaScript na página. Em modo de desenvolvimento, o [DevToolsManager](../api/DevToolsManager.md#controllers) do app coloca a store em `globalThis.__DC__`: `__DC__.controller` é o seu [Controller](../api/Controller.md), então todos os métodos do Controller funcionam, e `__DC__.actions` são as suas [actions](../api/Actions.md) recentes.

## Pré-requisitos {#prerequisites}

1. Servidor de desenvolvimento em execução com `NODE_ENV !== 'production'`
2. Uma ferramenta de navegador que execute JavaScript na página, com o app carregado (veja Ferramentas de navegador)
3. `DevToolsManager` incluído nos managers do :react[`DataProvider`]:vue[`DataClientPlugin`] (padrão em modo de desenvolvimento)

## Ferramentas de navegador {#browser-tools}

Todo snippet abaixo é uma função. Encontre a sua ferramenta na tabela: ela executa snippets de uma das formas abaixo, e a
sua página de configuração explica como abrir a página.

| Ferramenta | Executa um snippet com | Como | Log de rede | Console | Configuração |
|---|---|---|---|---|---|
| Agent desktop do Cursor | `browser_cdp` | [Expressão com await](#awaited-expression) | [snippet de requisições](#without-a-network-or-console-tool) | [captura do console](#without-a-network-or-console-tool) | [browser-cursor](./browser-cursor.md#desktop-agent) |
| Agent em nuvem do Cursor | `browser_evaluate` após ativar o Playwright | [Função](#function) | `browser_network_requests` | `browser_console_messages` | [browser-cursor](./browser-cursor.md#cloud-agent) |
| Chrome DevTools MCP | `evaluate_script` | [Função](#function) | `list_network_requests` | `list_console_messages` | [browser-chrome-devtools-mcp](./browser-chrome-devtools-mcp.md) |
| Playwright MCP | `browser_evaluate` | [Função](#function) | `browser_network_requests` | `browser_console_messages` | [browser-playwright-mcp](./browser-playwright-mcp.md) |
| Claude in Chrome | `javascript_tool` | [Expressão](#expression) | `read_network_requests` | `read_console_messages` | [browser-claude-in-chrome](./browser-claude-in-chrome.md) |

Qualquer outra ferramenta funciona se executar JavaScript na página e devolver o resultado: escolha a forma abaixo que corresponde a ela
(o `page.evaluate` do Playwright é uma função; o `Runtime.evaluate` do CDP é uma expressão com await). Um navegador que só
consegue clicar, digitar e ler o console não consegue executar estes snippets; conecte uma das ferramentas acima.

### Função {#function}

A ferramenta recebe uma função, chama-a na página e aguarda o seu resultado. Passe o snippet exatamente como está escrito.

### Expressão com await {#awaited-expression}

A ferramenta avalia uma expressão, como o `Runtime.evaluate` do CDP. Chame o snippet e faça a ferramenta aguardá-lo:

- `expression`: `(<snippet>)()`
- `awaitPromise`: `true`
- `returnByValue`: `true`

O valor do snippet está em `result.value`. Verifique `exceptionDetails` primeiro: um throw ou uma promise rejeitada aparece ali,
e uma rejeição ainda devolve `result.value` como `{}`. `{}` também é o que volta para uma função solta
(`result.type` `"function"`), um snippet assíncrono sem `awaitPromise` e um nó do DOM, então devolva dados simples.

### Expressão {#expression}

A ferramenta devolve o valor da última expressão e não aguarda promises. Chame um snippet síncrono:
`(<snippet>)()`. Inicie um assíncrono com isto e depois leia `__DC_RESULT__` na chamada seguinte até que esteja definido. Ele
contém `{ value }`, ou `{ error }` se o snippet lançou um erro. Execute um snippet assíncrono por vez.

```js
globalThis.__DC_RESULT__ = undefined; // so an earlier snippet's result can't be read as this one's
(<snippet>)().then(
  value => (globalThis.__DC_RESULT__ = { value }),
  e => (globalThis.__DC_RESULT__ = { error: String(e) }),
);
```

### Sem uma ferramenta de rede ou de console {#without-a-network-or-console-tool}

URLs, durações e status das requisições a partir das entradas de `performance` da página:

```js
// run in page — requests
() => performance.getEntriesByType('resource').map(e => ({
  url: e.name,
  duration: e.duration,
  status: e.responseStatus,
  transferSize: e.transferSize,
  bodySize: e.decodedBodySize,
}))
```

`transferSize` `0` com um `bodySize` diferente de zero significa que o cache HTTP do navegador respondeu sem consultar o servidor; ambos são `0` para uma resposta de outra origem sem `Timing-Allow-Origin`, que oculta os tamanhos. `status` é `0` para qualquer resposta de outra origem lida sem CORS (imagens e fontes também, mesmo quando carregam), e
requisições bloqueadas podem estar ausentes, então verifique as falhas no erro em `meta` da chave ([Erros](#errors)).

Para ler a saída do console, instale esta captura do console após cada carregamento da página. Ela registra chamadas posteriores ao console,
erros não capturados e rejeições não tratadas; leia-os com `__DC_CONSOLE__.slice(-20)`. Para erros do carregamento da página,
instale-a e depois repita a ação (`invalidateAll` em [Alterar o estado](#change-state), ou uma navegação dentro do app).

```js
// run in page — console capture
() => {
  if (globalThis.__DC_CONSOLE__) return { ok: true, count: __DC_CONSOLE__.length };
  const log = (globalThis.__DC_CONSOLE__ = []);
  const text = (a) => {
    if (a instanceof Error) return a.stack ?? String(a);
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  };
  const push = (level, args) => {
    log.push({ level, time: Date.now(), text: args.map(text).join(' ') });
    if (log.length > 200) log.splice(0, 100);
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const orig = console[level];
    console[level] = (...args) => { push(level, args); return orig.apply(console, args); };
  }
  addEventListener('error', (e) => push('uncaught', [e.error ?? e.message]));
  addEventListener('unhandledrejection', (e) => push('unhandledrejection', [e.reason]));
  return { ok: true, count: 0 };
}
```

## Por onde começar {#where-to-start}

| Sintoma | Verifique primeiro |
|---|---|
| Os dados nunca aparecem ou ficam carregando | O erro em `meta` da chave ([Erros](#errors)) e a sua requisição no log de rede |
| Uma mutação teve sucesso, mas a UI mostra dados antigos | O erro em `meta` da chave da mutação: uma resposta que falha ao normalizar, como uma envolvida em `{ data }`, é armazenada ali, não na action. Depois `state.entities`: se a entity não mudou e a resposta está apenas sob a chave `endpoints` da própria mutação, o endpoint não tem `schema`. Um item criado que falta em uma lista: compare a chave da lista em `state.endpoints` com os args com que o create ou o `getList.push` foi chamado; como uma Collection associa listas está na skill "data-client-schema" |
| Uma alteração aparece e depois reverte sozinha | O erro em `meta` da chave da mutação: uma alteração otimista reverte quando a sua requisição falha. Se não houver nenhum, repita a alteração e leia o log por horário ([Actions](#actions)) em busca de um `rdc/setresponse` posterior com um `meta.fetchedAt` mais recente (geralmente um poll) que trouxe o valor antigo; se trouxe uma versão mais antiga da entity, a correção está na definição dessa Entity (skill "data-client-schema"). Se o servidor já devolve o novo valor, algo no caminho serviu o antigo: o cache HTTP do navegador responde com `transferSize` `0` e um `bodySize` diferente de zero (snippet de requisições) |
| Requisições disparam com muita frequência | Os horários das requisições no log de rede, depois o log ([Actions](#actions)) dessa chave: se um `rdc/invalidate` ou `rdc/invalidateall` vem antes de cada fetch (algo, geralmente um Manager, continua invalidando-a). `pollFrequency` é em milissegundos |
| Requisições nunca disparam | O `meta.expiresAt` da chave: os dados permanecem atualizados até lá. Uma chave com polling também precisa de um `rdc/subscribe` no log |

## A store {#the-store}

Os snippets usam a entity `Todo` e caminhos que contêm `/todos`: substitua-os pelos do seu app.

- **Várias stores** (`__DC__.controller` lança `Set __DC__.store to one of: ...`): defina `__DC__.store` com a chave
  em `__DC__.stores` cujo `getState().endpoints` contém as chaves que você está depurando. Um carregamento de página a limpa.
- **`__DC__` é undefined**: a página é um build de produção, seus managers deixam de fora o `DevToolsManager`, ou seus
  pacotes `@data-client` são anteriores à 0.19.

## Ler o estado {#read-state}

A resposta desnormalizada de uma chave, como os componentes a veem. O log de actions guarda o endpoint e os `args` de cada chave
buscada, então isto funciona para qualquer chave lida desde o carregamento da página:

```js
// run in page — response for a key
() => {
  const c = __DC__.controller, state = c.getState();
  // a fetch of the key, not a mutation of an item under it
  const a = __DC__.actions.findLast(
    a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
  );
  if (!a) return { error: 'key not in the action log; repeat the fetch' };
  const { data, expiryStatus, expiresAt } = c.getResponse(a.endpoint, ...a.args, state);
  return { key: a.key, data, expiryStatus, expiresAt, error: c.getError(a.endpoint, ...a.args, state)?.message };
}
```

`expiryStatus`: `1` Invalid, `2` InvalidIfStale, `3` Valid. Para buscá-la novamente e ler a resposta atualizada:

```js
// run in page — refetch a key
async () => {
  const c = __DC__.controller;
  // skip mutations: fetching their endpoint would send the change again
  const a = __DC__.actions.findLast(
    a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
  );
  if (!a) return { error: 'key not in the action log' };
  await c.fetch(a.endpoint, ...a.args);
  return c.getResponse(a.endpoint, ...a.args, c.getState()).data;
}
```

O estado normalizado bruto, para chaves que não estão mais no log ou para ver como as entities são armazenadas (formato em
[Referência do formato do estado](#state-shape-reference)):

```js
// run in page — cache entries by path substring
() => {
  const state = __DC__.controller.getState();
  return Object.keys(state.endpoints).filter(k => k.includes('/todos')).map(key => ({
    key, value: state.endpoints[key], meta: state.meta[key],
  }));
}
```

`getState().entities.Todo` contém cada `Todo` por pk.

## Actions {#actions}

O log guarda as 100 actions mais recentes e, para cada chave com polling (endpoint e args), apenas as últimas poucas. Apenas as
20 mais recentes mantêm seu `response`; para ver um payload, repita a action e leia-o imediatamente. As entradas são descartadas
do início, então selecione por horário (`meta.fetchedAt >= start`), não por índice. As actions guardam endpoints e promises, então mapeie-as
para campos simples:

```js
// run in page — recent actions
() => __DC__.actions.slice(-20).map(a => ({
  type: a.type,
  key: a.key,
  endpoint: a.endpoint?.name,
  args: a.args,
  fetchedAt: a.meta?.fetchedAt,
  error: a.error ? (a.response?.message || true) : undefined,
}))
```

### Erros {#errors}

Erros lançados ao armazenar uma resposta (por exemplo, uma chave primária ausente) aparecem apenas em `meta`, sem `error`
na action, então verifique ambos:

```js
// run in page — errors
() => ({
  actions: __DC__.actions
    .filter(a => a.error)
    .map(a => ({ type: a.type, key: a.key, error: a.response?.message || true })),
  meta: Object.entries(__DC__.controller.getState().meta)
    .filter(([, m]) => m.error)
    .map(([key, m]) => ({ key, error: m.error.message, status: m.error.status })),
})
```

## Alterar o estado {#change-state}

Use métodos do Controller, nunca dispatches brutos: eles registram as mesmas actions que as chamadas do próprio app.

```js
// run in page — invalidate keys by path substring
() => {
  __DC__.controller.invalidateAll({ testKey: key => key.includes('/todos') });
  return { invalidated: true };
}
```

`expireAll` recebe o mesmo `testKey` e marca as chaves como desatualizadas sem refazer o fetch até o próximo uso.
`setResponse(a.endpoint, ...a.args, value)` com uma action registrada injeta dados de mock, e `resetEntireStore()`
limpa tudo.

## Referência do formato do estado {#state-shape-reference}

```ts
State = {
  entities: { [entityKey: string]: { [pk: string]: EntityInstance } },
  endpoints: { [cacheKey: string]: PK | PK[] | unknown },
  indexes: { [entityKey: string]: { [indexName: string]: { [lookupValue: string]: PK } } },
  meta: {
    [key: string]: {
      date, fetchedAt, expiresAt,
      prevExpiresAt?, error?, invalidated?, errorPolicy?: 'hard' | 'soft'
    }
  },
  entitiesMeta: { [entityKey: string]: { [pk: string]: { date, expiresAt, fetchedAt } } },
  optimistic: (SetResponseAction | OptimisticAction)[],
  lastReset: number,
}
```
