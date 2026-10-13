---
title: Data Client para agentes de programación
description: Las Agent Skills, un plugin de Claude Code, la depuración con Chrome DevTools MCP y llms.txt ayudan a los agentes de programación a escribir, depurar y actualizar aplicaciones de Data Client
image: /img/social/coding-agents-card.png
authors: [ntucker]
tags: [agents, vue]
draft: true
---

import SkillTabs from '@site/src/components/SkillTabs';

Los agentes de programación escriben hoy mucho código de Data Client, y lo escriben mejor cuando cuentan con la documentación y
los flujos de trabajo actuales en lugar de adivinar a partir de versiones anteriores. Este ciclo de lanzamientos facilita configurar eso para cualquier agente.

**Nuevo:**

- [Plugin de Claude Code](/blog/2026/10/06/coding-agents#claude-plugin) - `claude plugin install react@data-client` instala las skills para tu framework
- [Skills de Vue](/blog/2026/10/06/coding-agents#vue-skills) - Los proyectos de Vue reciben composables y pruebas de Vue, no hooks de React
- [llms.txt](/blog/2026/10/06/coding-agents#llms-txt) - Cualquier agente puede leer la documentación como markdown, y cada página le indica dónde buscar

**También disponible:**

- [Agent Skills](/blog/2026/10/06/coding-agents#skills) - Define APIs REST, diseña schemas, escribe Managers y prueba; [/data-client-setup](/blog/2026/10/06/coding-agents#setup) ahora instala solo las que necesitas, y se [generan a partir de esta documentación](/blog/2026/10/06/coding-agents#generated-references)
- [Chrome DevTools MCP](/blog/2026/10/06/coding-agents#debugging) - Los agentes inspeccionan el store de tu aplicación en ejecución, o usan Expo MCP para React Native
- [Skills de actualización](/blog/2026/10/06/coding-agents#upgrades) - Las skills de migración actualizan tu código, incluso lo que los codemods no pueden

{/* truncate */}

## Primeros pasos {#setup}

Instala la skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup) y ejecútala. Detecta
React o Vue y tu estilo de API (REST, GraphQL o personalizado), instala las skills que tu proyecto necesita y configura
Data Client. Para REST delega en
[data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup), que migra las llamadas existentes a `fetch` o
axios a endpoints ([#4153](https://github.com/reactive/data-client/pull/4153)).

<SkillTabs skill="data-client-setup" />

[Agent Skills](/docs/getting-started/agent-skills) enumera todas las skills y cómo instalarlas todas desde el principio.

## Plugin de Claude Code {#claude-plugin}

El repositorio de Data Client es un marketplace de plugins de Claude Code. El plugin `core` contiene las skills de configuración, REST, GraphQL, schemas y
Managers; los plugins `react` y `vue` añaden las skills de su framework e incorporan `core`; y el plugin `migrations`
añade las skills de actualización ([#4153](https://github.com/reactive/data-client/pull/4153)). La página
[Agent Skills](/docs/getting-started/agent-skills) muestra la misma instalación con la CLI de skills y OpenSkills.

```bash
claude plugin marketplace add reactive/data-client
claude plugin install react@data-client
```

Usa `vue@data-client` para Vue, `core@data-client` si no usas ninguno de los dos, y añade `migrations@data-client` antes de una actualización.

## Skills de Vue {#vue-skills}

Los proyectos de Vue antes recibían la skill de hooks de React, así que los agentes recurrían a patrones de React. La
skill [data-client-vue](https://skills.sh/reactive/data-client/data-client-vue) escribe código de `DataClientPlugin` y de composables,
y [depura una aplicación en ejecución](/vue/getting-started/debugging#debugging-with-agents)
([#4126](https://github.com/reactive/data-client/pull/4126)).
[data-client-vue-testing](https://skills.sh/reactive/data-client/data-client-vue-testing) escribe pruebas con `renderDataCompose()`
y `mountDataClient()` ([#4126](https://github.com/reactive/data-client/pull/4126)) que siguen las
[guías de pruebas de Vue](/vue/guides/unit-testing-composables) ([#4181](https://github.com/reactive/data-client/pull/4181)).

## llms.txt {#llms-txt}

Los agentes sin skills pueden leer la documentación como markdown, siguiendo la convención [llms.txt](https://llmstxt.org)
([#4171](https://github.com/reactive/data-client/pull/4171), [#4236](https://github.com/reactive/data-client/pull/4236)):

- [llms.txt](https://dataclient.io/llms.txt) para React y [vue/llms.txt](https://dataclient.io/vue/llms.txt) para Vue indexan todas las páginas, y el `llms-full.txt` junto a cada uno las contiene todas en un solo archivo
- [rest/llms.txt](https://dataclient.io/rest/llms.txt) y [graphql/llms.txt](https://dataclient.io/graphql/llms.txt) cubren solo la API de ese paquete
- Cualquier página de la documentación es markdown cuando añades `.md` a su URL, como [/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)

Cada página enlaza su llms.txt en `<head>`, y cada página de la documentación enlaza su markdown, de modo que un agente al que se le da la URL de cualquier página
los encuentra por su cuenta.

## Las skills coinciden con la documentación {#generated-references}

Las páginas de referencia de las skills ahora se generan por framework a partir de esta documentación, así que incluyen fragmentos compartidos como los comandos
de instalación y dan a los proyectos de Vue solo código de Vue. Una comprobación de CI falla cuando una skill se desvía de la documentación, así que las skills se mantienen
al día con cada lanzamiento ([#4170](https://github.com/reactive/data-client/pull/4170)).

## También disponible {#also-available}

### Skills para cada tarea {#skills}

Más allá de la configuración, hay skills para cada parte de una aplicación de Data Client. `/data-client-setup` instala las que tu proyecto
usa:

- [data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup) migra clientes `fetch`, axios, ky, got o superagent a [RestEndpoint](/rest/api/RestEndpoint), junto con la [guía de migración desde axios](/rest/guides/axios-migration) y su codemod ([#3867](https://github.com/reactive/data-client/pull/3867))
- [data-client-graphql-setup](https://skills.sh/reactive/data-client/data-client-graphql-setup) y [data-client-endpoint-setup](https://skills.sh/reactive/data-client/data-client-endpoint-setup) cubren GraphQL y funciones asíncronas personalizadas
- [data-client-rest](https://skills.sh/reactive/data-client/data-client-rest) define APIs con [resource()](/rest/api/resource) y [RestEndpoint](/rest/api/RestEndpoint)
- [data-client-schema](https://skills.sh/reactive/data-client/data-client-schema) diseña schemas [Entity](/rest/api/Entity), [Collection](/rest/api/Collection), [Union](/rest/api/Union) y [Query](/rest/api/Query)
- [data-client-manager](https://skills.sh/reactive/data-client/data-client-manager) escribe [Managers](/docs/concepts/managers) para websockets, SSE, sondeo (polling) y registro de logs
- [data-client-react](https://skills.sh/reactive/data-client/data-client-react) y [data-client-react-testing](https://skills.sh/reactive/data-client/data-client-react-testing) usan y prueban los hooks de React

Explóralas todas en [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

### Depurar una aplicación en ejecución {#debugging}

Pregúntale a tu agente "¿por qué esto no volvió a obtener los datos?" o "¿qué hay en la caché ahora mismo?" y podrá revisar la aplicación en ejecución en lugar
de adivinar a partir del código. En modo de desarrollo, [DevToolsManager](/docs/api/DevToolsManager#controllers) coloca el
[Controller](/docs/api/Controller) de cada store en `globalThis.__DC_CONTROLLERS__`, así que un agente conectado mediante
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), o
[Expo MCP](https://docs.expo.dev/eas/ai/mcp/) para React Native, puede leer el store, seguir las acciones despachadas y
relacionarlas con las solicitudes de red. El mapa está disponible en navegadores, React Native y Node
([#3753](https://github.com/reactive/data-client/pull/3753)).

```js title="Browser DevTools console"
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

Las skills de React y Vue aprovechan esto mediante Chrome DevTools MCP; consulta
[depuración con agentes](/docs/getting-started/debugging#debugging-with-agents) para ver qué pueden inspeccionar.

### Skills de actualización {#upgrades}

Las skills también se encargan de las actualizaciones. La skill de v0.18 ejecuta el [codemod](/codemods/v0.18.js) y luego se ocupa de lo que este no puede, como
registrar [`argsKey`](/rest/api/SchemaSimple) para los schemas cuya salida depende de los argumentos del endpoint
([migración a v0.18](/blog/2026/05/01/v0.18-scalar-typed-downloads#migration-guide)). La skill de path-to-regexp v8 reescribe
la [sintaxis de rutas](/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy#path-to-regexp-v8) en tus endpoints.

<SkillTabs skills={['data-client-v0.18-migration', 'path-to-regexp-v8-migration']} />
