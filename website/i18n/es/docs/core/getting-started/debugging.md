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

Instala la :react[[skill `data-client-react`](https://skills.sh/reactive/data-client/data-client-react)]:vue[[skill `data-client-vue`](https://skills.sh/reactive/data-client/data-client-vue)]
en tu agente de programación y luego pídele que inspeccione la página o el estado actual de la aplicación.

### Cómo funciona la depuración con agentes {#how-agent-debugging-works}

En modo de desarrollo, [DevToolsManager](../api/DevToolsManager.md) expone instancias activas de `Controller` para que un agente pueda inspeccionar
el estado del caché, los metadatos de los endpoints y las acciones despachadas directamente desde la aplicación en ejecución.

Técnicamente, esos controllers se almacenan en [`globalThis.__DC_CONTROLLERS__`](../api/DevToolsManager.md#controllers), que es un
`Map` global del navegador. Puedes pensar en él como un registro temporal del modo de desarrollo que permite a las herramientas
y a los agentes localizar los stores activos de :react[`DataProvider`]:vue[`DataClientPlugin`] de la página actual.

A grandes rasgos, el agente puede:

- descubrir los controllers activos de :react[`DataProvider`]:vue[`DataClientPlugin`]
- leer el estado del caché normalizado o desnormalizado
- inspeccionar fetches, respuestas, errores e invalidaciones recientes
- correlacionar los cambios del store con la actividad de red del navegador
- ejecutar operaciones seguras del controller, como la invalidación o la expiración, con fines de investigación

Esto es útil cuando quieres una respuesta rápida a preguntas como "¿por qué no se volvió a obtener esto?",
"¿qué hay en el caché ahora mismo?" o "¿qué acción actualizó esta entity?" sin tener que
recorrer manualmente cada panel del inspector.

La skill hace todo esto mediante [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp).

## Depuración manual {#manual-debugging}

Si prefieres inspeccionarlo todo tú mismo, el flujo de trabajo con las herramientas de desarrollo del navegador que se describe a continuación sigue
siendo la vía manual estándar.

### Instalación {#installation}

Agrega la extensión del navegador para
[Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
o
[Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Abrir las herramientas de desarrollo {#open-dev-tools}

:::react

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botón del navegador de redux-devtools](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![botón de Reactive Data Client](/img/client-logo.svg)
</span>
</span>

:::

:::vue

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botón del navegador de redux-devtools](/img/devtools-browser-button.png)
</span>

:::

Después de instalarla y cargar tu sitio en :react[[modo de desarrollo](https://webpack.js.org/guides/development/)]:vue[[modo de desarrollo](https://vite.dev/guide/env-and-mode)], :react[haz clic en el logotipo de <abbr title="Reactive Data Client">Data Client</abbr> (por defecto, en la esquina inferior derecha de la ventana) o en el
logotipo de redux-devtool en la barra de direcciones.]:vue[haz clic en el logotipo de redux-devtool en la barra de direcciones.]

Al hacerlo se abrirá el inspector, que te permite observar las acciones despachadas,
su efecto en el estado del store, así como el estado actual del store.

:::react

El logotipo de <abbr title="Reactive Data Client">Data Client</abbr> solo aparece en modo de desarrollo. Sin embargo, su
ubicación se puede mover o desactivar por completo mediante la [prop devButton de DataProvider](../api/DataProvider.md#devbutton).

:::

![browser-devtools](/img/devtool-action.png 'Reactive Data Client devtools')

El [Controller](../api/Controller.md) despacha acciones, lo que hace que esa página sea útil para entender
qué acciones estás viendo. Aquí observamos las acciones comunes de [fetch](../api/Controller.md#fetch)
y [setResponse](../api/Controller.md#setResponse).

:::note

De forma predeterminada, la integración con devtool filtra las acciones [fetch](../api/Controller.md#fetch) duplicadas.
Esto se puede cambiar con la opción [skipLogging](../api/DevToolsManager.md#skiplogging).

:::

### Flujo de control {#control-flow}

<abbr title="Reactive Data Client">Data Client</abbr> usa el patrón de [store flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/), lo que hace que la depuración sea
sencilla, ya que cada cambio es rastreable y descriptivo.

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

> [Más información sobre el flujo de control](../concepts/managers.md)

### Inspección del estado {#state-inspection}

Cuando se usan [schemas](/rest/api/schema), las respuestas se [normalizan](../concepts/normalization.md) en las tablas `entities`
y `endpoints`. Esto aporta ventajas de rendimiento automáticas frente a cachés de fetch clave-valor más simples, especialmente
beneficiosas con datos dinámicos (que cambian). Además, elimina los errores por inconsistencia de datos.

![Inspector de estado de las herramientas de desarrollo](/img/devtool-state.png 'Inspector de estado de Reactive Data Client devtools')

Haz clic en la pestaña **'state'**
de devtools para ver el estado completo del store. Esto puede ser útil para determinar exactamente dónde están los datos. También hay
una sección 'meta' del caché con información como el momento en que se realizó la solicitud (útil para el [TTL](../concepts/expiry-policy.md)).

### Diferencias de estado {#state-diff}

Para monitorear la respuesta de un fetch en particular, puede ser más útil ver cómo se actualiza el store.
Haz clic en la pestaña 'Diff' para ver qué cambió.

![Inspector de diferencias de las herramientas de desarrollo](/img/devtool-diff.png 'Diff de Reactive Data Client devtools')

Aquí alternamos el estado 'completed' de una tarea pendiente mediante una [actualización optimista](/rest/guides/optimistic-updates).

### Rastreo de acciones {#action-tracing}

El rastreo no está habilitado de forma predeterminada, ya que es muy costoso computacionalmente. Sin embargo, puede ser muy útil
para encontrar desde dónde se despachan las [acciones](../api/Actions.md). Personaliza [DevToolsManager](../api/DevToolsManager.md)
estableciendo la opción trace en `true` con [getDefaultManagers](../api/getDefaultManagers.md):

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
