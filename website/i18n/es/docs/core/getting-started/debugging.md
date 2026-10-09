---
title: Depuración e inspección
sidebar_label: Depuración
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

## Depuración con agentes {#debugging-with-agents}

Para muchas tareas de depuración, el camino más rápido es usar un agente que ya conozca el
flujo de depuración de :react[`@data-client/react`]:vue[`@data-client/vue`].

Instala la skill :react[[`data-client-react` skill](https://skills.sh/reactive/data-client/data-client-react)]:vue[[`data-client-vue` skill](https://skills.sh/reactive/data-client/data-client-vue)]
en tu agente de programación y pídele que inspeccione la página actual o el estado de la aplicación.

### Cómo funciona la depuración con agentes {#how-agent-debugging-works}

En modo de desarrollo, [DevToolsManager](../api/DevToolsManager.md) expone instancias vivas de `Controller` para que un agente pueda inspeccionar
el estado de la caché, los metadatos de los endpoints y las acciones despachadas directamente desde la aplicación en ejecución.

En la práctica, esos controllers se guardan en [`globalThis.__DC_CONTROLLERS__`](../api/DevToolsManager.md#controllers), que es un
`Map` global del navegador. Puedes verlo como un registro temporal del modo de desarrollo que permite a las herramientas
y a los agentes localizar los stores activos de :react[`DataProvider`]:vue[`DataClientPlugin`] de la página actual.

A grandes rasgos, el agente puede:

- descubrir los controllers activos de :react[`DataProvider`]:vue[`DataClientPlugin`]
- leer el estado de la caché normalizado o desnormalizado
- inspeccionar obtenciones, respuestas, errores e invalidaciones recientes
- correlacionar los cambios del store con la actividad de red del navegador
- disparar operaciones seguras del controller, como la invalidación o la caducidad, para investigar

Esto sirve cuando quieres una respuesta rápida a preguntas como «¿por qué esto no se volvió a obtener?»,
«¿qué hay en la caché ahora mismo?» o «¿qué acción actualizó esta entidad?», sin tener que
hacer clic a mano por cada panel del inspector.

La skill hace esto a través de [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp).

## Depuración manual {#manual-debugging}

Si prefieres inspeccionarlo todo tú, el flujo de las herramientas de desarrollo del navegador que aparece abajo
sigue siendo el camino manual habitual.

### Instalación {#installation}

Añade la extensión de navegador:
[extensión de Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
o
[extensión de Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Abrir las herramientas de desarrollo {#open-dev-tools}

:::react

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botón de redux-devtools en el navegador](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![botón de Reactive Data Client](/img/client-logo.svg)
</span>
</span>

:::

:::vue

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botón de redux-devtools en el navegador](/img/devtools-browser-button.png)
</span>

:::

Después de instalarla y cargar tu sitio en :react[[modo de desarrollo](https://webpack.js.org/guides/development/)]:vue[[modo de desarrollo](https://vite.dev/guide/env-and-mode)], :react[o bien
haces clic en el logo de <abbr title="Reactive Data Client">Data Client</abbr> (por defecto, abajo a la derecha de la ventana) o en el
logo de redux-devtool en la barra de direcciones.]:vue[haz clic en el logo de redux-devtool en la barra de direcciones.]

Al hacer clic se abre el inspector, que te permite observar las acciones despachadas,
su efecto sobre el estado del store y el estado actual del store.

:::react

El logo de <abbr title="Reactive Data Client">Data Client</abbr> solo aparece en modo de desarrollo. Aun así, su
ubicación se puede mover o desactivar por completo con la [prop devButton de DataProvider](../api/DataProvider.md#devbutton).

:::

![herramientas de desarrollo del navegador](/img/devtool-action.png 'herramientas de desarrollo de Reactive Data Client')

El [Controller](../api/Controller.md) despacha acciones, así que esa página sirve para entender
qué acciones ves. Aquí observamos acciones habituales de [fetch](../api/Controller.md#fetch)
y [setResponse](../api/Controller.md#setResponse).

:::note

Por defecto, la integración con devtools filtra las acciones [fetch](../api/Controller.md#fetch) duplicadas.
Esto se puede cambiar con la opción [skipLogging](../api/DevToolsManager.md#skiplogging).

:::

### Flujo de control {#control-flow}

<abbr title="Reactive Data Client">Data Client</abbr> usa el patrón de [store de Flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/), lo que hace que la depuración
sea directa, porque cada cambio se puede rastrear y es descriptivo.

<div style={{textAlign:'center'}}>
<ThemedImage
  alt="FLUX"
  sources={{
    light: useBaseUrl('/img/diagrams/flux-simple.png'),
    dark: useBaseUrl('/img/diagrams/flux-simple-dark.png'),
  }}
  style={{maxHeight:"260px"}}
/>
</div>

> [Más sobre el flujo de control](../concepts/managers.md)

### Inspección del estado {#state-inspection}

Cuando se usan [schemas](/rest/api/schema), las respuestas se [normalizan](../concepts/normalization.md) en tablas de `entities`
y `endpoints`. Esto da ventajas de rendimiento automáticas frente a cachés de obtención más simples, de clave-valor; sobre todo
con datos dinámicos (que cambian). También elimina bugs de inconsistencia de datos.

![inspector de estado de las herramientas de desarrollo](/img/devtool-state.png 'inspector de estado de las herramientas de desarrollo de Reactive Data Client')

Haz clic en la pestaña **«state»**
de devtools para ver el estado completo del store. Sirve para saber exactamente dónde están los datos. También hay
una sección «meta» de la caché con información como cuándo ocurrió la petición (útil para el [TTL](../concepts/expiry-policy.md)).

### Diff del estado {#state-diff}

Para seguir una respuesta de obtención concreta, puede ser más útil ver cómo se actualiza el store.
Haz clic en la pestaña «Diff» para ver qué cambió.

![inspector de diff de las herramientas de desarrollo](/img/devtool-diff.png 'diff de las herramientas de desarrollo de Reactive Data Client')

Aquí alternamos el estado «completed» de un todo con una [actualización optimista](/rest/guides/optimistic-updates).

### Rastreo de acciones {#action-tracing}

El rastreo no está activado por defecto porque es muy costoso en cómputo. Aun así, puede ser muy útil
para localizar desde dónde se despachan las [acciones](../api/Actions.md). Personaliza [DevToolsManager](../api/DevToolsManager.md)
poniendo la opción trace en `true` con [getDefaultManagers](../api/getDefaultManagers.md):

:::react

```tsx title="index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import App from './App.vue';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');
```

:::
