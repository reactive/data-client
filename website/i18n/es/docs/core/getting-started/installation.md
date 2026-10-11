---
id: installation
title: Primeros pasos con Reactive Data Client
sidebar_label: Instalación
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import Installation from '../shared/\_installation.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';
import SiteOnly from '@site/src/components/SiteOnly';

:::react

<PkgTabs pkgs="@data-client/react @data-client/test @data-client/rest" />

:::

<SiteOnly>

:::tip[Usa Agent Skills]

¿Prefieres generar la estructura inicial con tu agente de IA? Consulta [Agent Skills](./agent-skills.md) y ejecuta `/data-client-setup`.

:::

</SiteOnly>

## :react[Agrega el proveedor en el componente de nivel superior]:vue[Instala el plugin] {#add-provider-at-top-level-component}

:::vue

Instala el [plugin de Vue](https://vuejs.org/guide/reusability/plugins.html) al crear tu aplicación.

:::

<Installation />

<center>

<Link className="button button--secondary" to="./resource">Siguiente: Definir los datos »</Link>

</center>

## Ejemplo {#example}

:::react

<StackBlitz app="todo-app" file="src/index.tsx,src/RootProvider.tsx" view="both" ctl="1" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/main.ts,src/pages/UserTodos.vue" view="both" ctl="1" />

:::

## Herramientas compatibles {#supported-tools}

<details>
<summary><b>TypeScript 4.0+</b></summary>

TypeScript es opcional, pero requiere al menos la versión [4.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types) y [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks) para una verificación de tipos completa.

:::vue

`@data-client/vue` necesita TypeScript 4.5 o posterior, ya que los propios tipos de Vue lo requieren.

:::

</details>

<details>
<summary><b>Compatibilidad con navegadores antiguos</b></summary>

Si tu aplicación apunta a navegadores antiguos (de hace unos años o más), asegúrate de cargar polyfills.
Normalmente esto se hace con [@babel/preset-env useBuiltIns: 'entry'](https://babeljs.io/docs/en/babel-preset-env#usebuiltins),
junto con la importación de [core-js](https://www.npmjs.com/package/core-js) en el punto de entrada de tu aplicación.

Así te aseguras de que solo se incluyan en el bundle de tu aplicación los polyfills necesarios para los navegadores que quieres soportar.

Por ejemplo, `TypeError: Object.hasOwn is not a function`

</details>
<details>
<summary><b>Compatibilidad con Internet Explorer</b></summary>

Si ves `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
sigue las instrucciones para [agregar compatibilidad con navegadores heredados a los paquetes](../guides/legacy-browser)

</details>

:::react

<details>
<summary><b>ReactJS 16-19 y React Native</b></summary>

Se admite ReactJS 16.2 y posteriores (¡la versión con hooks!). React 18 ofrece un soporte y unas funcionalidades mejoradas de [Suspense](../api/useSuspense.md). Se admiten tanto React Native como [React Navigation](https://reactnavigation.org/) y [Expo](https://docs.expo.dev).

Si tienes un proyecto funcionando con otras
bibliotecas de React, [compártelo con los demás](https://github.com/reactive/data-client/discussions/2422) en nuestras
discusiones.

</details>

:::

:::vue

<details>
<summary><b>Vue 3</b></summary>

`@data-client/vue` es compatible con Vue 3 y está construido sobre la [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html).

</details>

:::
