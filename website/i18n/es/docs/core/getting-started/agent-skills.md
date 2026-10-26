---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import AgentOnly from '@site/src/components/AgentOnly';

## Instala skills para obtener los mejores resultados {#install-skills-for-best-results}

Los agentes aciertan con lo básico solo con el nombre del paquete. Las [skills](https://agentskills.io) les enseñan las
APIs actuales para el resto, como los fixtures de prueba y los managers en tiempo real.

Si tu aplicación ya tiene paquetes `@data-client`, enlaza las skills que incluyen, ajustadas a sus versiones:

```bash framed
npx --no data-client-skills
```

Si no, instala la skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup):

<SkillTabs skill="data-client-setup" framed />

Luego ejecútala en el chat de tu agente:

```prompt framed
/data-client-setup
```

Detecta tu framework y tu estilo de API (REST, GraphQL, personalizado), instala las skills correspondientes de la lista de abajo,
configura el provider y migra los endpoints existentes.

### Instalar todas las skills desde el principio {#install-all-skills-up-front}

Para instalar ahora todas las skills de tu framework, sin dejar que tu agente ejecute las instalaciones:

<SkillTabs />

La pestaña **Paquetes instalados** enlaza las skills que incluye cada paquete `@data-client/*` instalado en `.agents/skills`
(con `.claude/skills` enlazando a esa carpeta), desde donde las cargan Claude Code, Cursor y Codex, ajustadas a la versión de ese paquete. Haz commit de los enlaces. Siguen a las actualizaciones,
y al ejecutarlo de nuevo recoge las skills de los paquetes que añadas o actualices. En Windows, haz commit de los enlaces solo con el Modo de desarrollador activado y
`git config core.symlinks true`; de lo contrario, déjalos sin commit y vuelve a ejecutar el comando después de instalar. Los plugins de Claude Code, Cursor y Codex configuran aplicaciones que aún no tienen Data
Client. Si usas [TanStack Intent](https://tanstack.com/intent), este carga las mismas skills de los paquetes.

### Skills disponibles {#available-skills}

- [**`/data-client`**](https://skills.sh/reactive/data-client/data-client) — es el punto de partida cuando le pides a tu agente que agregue o use Data Client, y lo dirige a la configuración o a la skill adecuada para la tarea.
- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — instala y configura Data Client para tu framework y estilo de API, junto con las skills que necesita.
- [**`/data-client-rest-setup`**](https://skills.sh/reactive/data-client/data-client-rest-setup) — configura `@data-client/rest` y migra los clientes
  `fetch`/`axios` existentes.
- [**`/data-client-endpoint-setup`**](https://skills.sh/reactive/data-client/data-client-endpoint-setup) — envuelve funciones asíncronas personalizadas con `Endpoint`
  para flujos de trabajo que no son REST ni GraphQL.
- [**`/data-client-graphql-setup`**](https://skills.sh/reactive/data-client/data-client-graphql-setup) — configura `@data-client/graphql` y `GQLEndpoint`
  para APIs GraphQL.
- [**`/data-client-schema`**](https://skills.sh/reactive/data-client/data-client-schema) — diseña `Entity`, `Collection`, `Union`, `Query`
  y schemas relacionados.
- [**`/data-client-rest`**](https://skills.sh/reactive/data-client/data-client-rest) — define APIs REST con `resource()`, `RestEndpoint`,
  métodos CRUD y análisis de respuestas.
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — implementa `Manager`s personalizados para websockets, SSE,
  sondeo (polling), suscripciones, registro de logs y middleware.

:::react

- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  y los hooks de mutación, y [depura tu aplicación en ejecución](./debugging.md#debugging-with-agents) desde una herramienta de navegador como el navegador de Cursor, Chrome DevTools MCP o Playwright MCP.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — escribe pruebas de React con `renderDataHook`,
  fixtures, interceptors y `nock`.

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  y los composables de mutación con `DataClientPlugin`, y [depura tu aplicación en ejecución](./debugging.md#debugging-with-agents) desde una herramienta de navegador como el navegador de Cursor, Chrome DevTools MCP o Playwright MCP.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — escribe pruebas de Vue con `renderDataCompose`,
  `mountDataClient`, fixtures y `nock`.

:::

Explora el catálogo completo en [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Configuración manual {#set-up-by-hand}

Para instalar los paquetes y añadir el provider tú mismo, sigue [Instalación](./installation.md).

<AgentOnly>

Cada página de la documentación también está disponible como markdown añadiendo `.md` a su URL, por ejemplo :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)].
:react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] las lista todas, y
:react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] contiene toda la documentación de :react[React]:vue[Vue], REST y GraphQL en un solo archivo.

</AgentOnly>
