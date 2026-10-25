---
title: Depuración en el navegador
---

Depura el estado y las acciones de :react[`@data-client/react`]:vue[`@data-client/vue`] de forma programática desde cualquier herramienta de navegador que ejecute JavaScript en la página. En modo de desarrollo, el [DevToolsManager](../api/DevToolsManager.md#controllers) de la aplicación pone el store en `globalThis.__DC__`: `__DC__.controller` es su [Controller](../api/Controller.md), por lo que funciona cualquier método de Controller, y `__DC__.actions` son sus [acciones](../api/Actions.md) recientes.

## Requisitos previos {#prerequisites}

1. Servidor de desarrollo en ejecución con `NODE_ENV !== 'production'`
2. Una herramienta de navegador que ejecute JavaScript en la página, con la aplicación cargada (consulta Herramientas de navegador)
3. `DevToolsManager` incluido en los managers de :react[`DataProvider`]:vue[`DataClientPlugin`] (viene por defecto en modo de desarrollo)

## Herramientas de navegador {#browser-tools}

Cada fragmento de código de abajo es una función. Busca tu herramienta en la tabla: ejecuta los fragmentos de una de las formas que se describen más abajo, y
su página de configuración explica cómo abrir la página.

| Herramienta | Ejecuta un fragmento con | Cómo | Registro de red | Consola | Configuración |
|---|---|---|---|---|---|
| Agente de escritorio de Cursor | `browser_cdp` | [Expresión con await](#awaited-expression) | [fragmento de requests](#without-a-network-or-console-tool) | [captura de consola](#without-a-network-or-console-tool) | [browser-cursor](./browser-cursor.md#desktop-agent) |
| Agente en la nube de Cursor | `browser_evaluate` una vez habilitado Playwright | [Función](#function) | `browser_network_requests` | `browser_console_messages` | [browser-cursor](./browser-cursor.md#cloud-agent) |
| Chrome DevTools MCP | `evaluate_script` | [Función](#function) | `list_network_requests` | `list_console_messages` | [browser-chrome-devtools-mcp](./browser-chrome-devtools-mcp.md) |
| Playwright MCP | `browser_evaluate` | [Función](#function) | `browser_network_requests` | `browser_console_messages` | [browser-playwright-mcp](./browser-playwright-mcp.md) |
| Claude in Chrome | `javascript_tool` | [Expresión](#expression) | `read_network_requests` | `read_console_messages` | [browser-claude-in-chrome](./browser-claude-in-chrome.md) |

Cualquier otra herramienta sirve si ejecuta JavaScript en la página y devuelve el resultado: elige la forma de abajo que le corresponda
(`page.evaluate` de Playwright es una función; `Runtime.evaluate` de CDP es una expresión con await). Un navegador que
solo puede hacer clic, escribir y leer la consola no puede ejecutar estos fragmentos; conecta en su lugar una de las herramientas anteriores.

### Función {#function}

La herramienta recibe una función, la llama en la página y espera su resultado. Pasa el fragmento exactamente como está escrito.

### Expresión con await {#awaited-expression}

La herramienta evalúa una expresión, como `Runtime.evaluate` de CDP. Llama al fragmento y haz que la herramienta lo espere:

- `expression`: `(<snippet>)()`
- `awaitPromise`: `true`
- `returnByValue`: `true`

El valor del fragmento es `result.value`. Revisa primero `exceptionDetails`: ahí aparece un throw o una promesa rechazada,
y un rechazo aun así devuelve `result.value` como `{}`. `{}` es también lo que se obtiene con una función sin llamar
(`result.type` `"function"`), un fragmento asíncrono sin `awaitPromise` y un nodo del DOM, así que devuelve datos simples.

### Expresión {#expression}

La herramienta devuelve el valor de la última expresión y no espera promesas. Llama a un fragmento síncrono así:
`(<snippet>)()`. Inicia uno asíncrono con esto y luego lee `__DC_RESULT__` en la siguiente llamada hasta que esté definido. Contiene
`{ value }`, o `{ error }` si el fragmento lanzó una excepción. Ejecuta un solo fragmento asíncrono a la vez.

```js
globalThis.__DC_RESULT__ = undefined; // so an earlier snippet's result can't be read as this one's
(<snippet>)().then(
  value => (globalThis.__DC_RESULT__ = { value }),
  e => (globalThis.__DC_RESULT__ = { error: String(e) }),
);
```

### Sin herramienta de red ni de consola {#without-a-network-or-console-tool}

Las URL, duraciones y estados de las peticiones, a partir de las entradas `performance` de la página:

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

`transferSize` `0` con un `bodySize` distinto de cero significa que la caché HTTP del navegador respondió sin consultar al servidor; ambos son `0` en una respuesta de origen cruzado sin `Timing-Allow-Origin`, que oculta los tamaños. `status` es `0` en cualquier respuesta de origen cruzado leída sin CORS (también imágenes y fuentes, aunque se carguen), y
las peticiones bloqueadas pueden faltar, así que revisa los fallos en el error de `meta` de la clave ([Errores](#errors)).

Para leer la salida de la consola, instala esta captura de consola después de cada carga de página. Registra las llamadas posteriores a la consola,
los errores no capturados y los rechazos no gestionados; léelos con `__DC_CONSOLE__.slice(-20)`. Para los errores de la carga de la página,
instálala y luego repite la acción (`invalidateAll` en [Cambiar el estado](#change-state), o una navegación dentro de la aplicación).

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

## Por dónde empezar {#where-to-start}

| Síntoma | Revisa primero |
|---|---|
| Los datos nunca aparecen o se quedan cargando | El error de `meta` de la clave ([Errores](#errors)) y su petición en el registro de red |
| Una mutación tuvo éxito pero la interfaz muestra datos antiguos | El error de `meta` de la clave de la mutación: una respuesta que no se puede normalizar, como una envuelta en `{ data }`, se guarda ahí, no en la acción. Luego `state.entities`: si la entity no cambió y la respuesta está solo bajo la propia clave de `endpoints` de la mutación, el endpoint no tiene `schema`. Si falta en una lista un elemento creado: compara la clave de la lista en `state.endpoints` con los args con los que se llamó a la creación o a `getList.push`; cómo una Collection hace coincidir las listas está en la skill "data-client-schema" |
| Un cambio aparece y luego se revierte solo | El error de `meta` de la clave de la mutación: un cambio optimista se revierte cuando su petición falla. Si no hay ninguno, repite el cambio y lee el registro por tiempo ([Acciones](#actions)) en busca de un `rdc/setresponse` posterior con un `meta.fetchedAt` más reciente (a menudo un sondeo) que traía el valor antiguo; si traía una versión más antigua de la entity, la solución está en la definición de esa Entity (skill "data-client-schema"). Si el servidor ya devuelve el valor nuevo, algo intermedio sirvió el antiguo: la caché HTTP del navegador responde con `transferSize` `0` y un `bodySize` distinto de cero (fragmento de requests) |
| Las peticiones se disparan demasiado a menudo | Los tiempos de las peticiones en el registro de red y luego el registro ([Acciones](#actions)) de esa clave: si un `rdc/invalidate` o `rdc/invalidateall` precede a cada fetch (algo, a menudo un Manager, la sigue invalidando). `pollFrequency` está en milisegundos |
| Las peticiones nunca se disparan | El `meta.expiresAt` de la clave: los datos se mantienen frescos hasta entonces. Una clave con sondeo también necesita un `rdc/subscribe` en el registro |

## El store {#the-store}

Los fragmentos usan la entity `Todo` y rutas que contienen `/todos`: reemplázalas por las de tu aplicación.

- **Varios stores** (`__DC__.controller` lanza `Set __DC__.store to one of: ...`): asigna a `__DC__.store` la clave
  de `__DC__.stores` cuyo `getState().endpoints` contenga las claves que estás depurando. Una carga de página lo borra.
- **`__DC__` es undefined**: la página es una compilación de producción, sus managers omiten `DevToolsManager`, o sus
  paquetes `@data-client` son anteriores a la 0.19.

## Leer el estado {#read-state}

La respuesta desnormalizada de una clave, tal como la ven los componentes. El registro de acciones guarda el endpoint y los `args` de cada clave obtenida,
por lo que esto funciona con cualquier clave leída desde que se cargó la página:

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

`expiryStatus`: `1` Invalid, `2` InvalidIfStale, `3` Valid. Para obtenerla de nuevo y leer la respuesta actualizada:

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

El estado normalizado sin procesar, para claves que ya no están en el registro o para ver cómo se almacenan las entities (su forma está en
[Forma del estado](#state-shape-reference)):

```js
// run in page — cache entries by path substring
() => {
  const state = __DC__.controller.getState();
  return Object.keys(state.endpoints).filter(k => k.includes('/todos')).map(key => ({
    key, value: state.endpoints[key], meta: state.meta[key],
  }));
}
```

`getState().entities.Todo` contiene cada `Todo` por pk.

## Acciones {#actions}

El registro conserva las 100 acciones más recientes y, de cada clave con sondeo (endpoint y args), solo las últimas. Solo las
20 más recientes conservan su `response`; para ver un payload, repite la acción y léelo de inmediato. Las entradas se descartan por
el principio, así que selecciona por tiempo (`meta.fetchedAt >= start`), no por índice. Las acciones contienen endpoints y promesas, así que
mapéalas a campos simples:

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

### Errores {#errors}

Los errores lanzados al almacenar una respuesta (por ejemplo, una clave primaria ausente) aparecen solo en `meta`, sin `error`
en la acción, así que revisa ambos:

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

## Cambiar el estado {#change-state}

Usa los métodos de Controller, nunca dispatches directos: registran las mismas acciones que las llamadas propias de la aplicación.

```js
// run in page — invalidate keys by path substring
() => {
  __DC__.controller.invalidateAll({ testKey: key => key.includes('/todos') });
  return { invalidated: true };
}
```

`expireAll` recibe el mismo `testKey` y marca las claves como obsoletas sin volver a obtenerlas hasta el siguiente uso.
`setResponse(a.endpoint, ...a.args, value)` con una acción registrada inyecta datos simulados, y `resetEntireStore()`
lo borra todo.

## Referencia de la forma del estado {#state-shape-reference}

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
