---
id: installation
title: Primeiros passos com o Reactive Data Client
sidebar_label: Instalação
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

:::tip[Use Agent Skills]

Prefere gerar a estrutura inicial por meio do seu agente de IA? Veja [Agent Skills](./agent-skills.md) e execute `/data-client-setup`.

:::

</SiteOnly>

## :react[Adicione o provider no componente de nível superior]:vue[Instale o plugin] {#add-provider-at-top-level-component}

:::vue

Instale o [plugin do Vue](https://vuejs.org/guide/reusability/plugins.html) ao criar seu app.

:::

<Installation />

<center>

<Link className="button button--secondary" to="./resource">Próximo: Definir dados »</Link>

</center>

## Exemplo {#example}

:::react

<StackBlitz app="todo-app" file="src/index.tsx,src/RootProvider.tsx" view="both" ctl="1" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/main.ts,src/pages/UserTodos.vue" view="both" ctl="1" />

:::

## Ferramentas compatíveis {#supported-tools}

<details>
<summary><b>TypeScript 4.0+</b></summary>

TypeScript é opcional, mas exige pelo menos a versão [4.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types) e [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks) para a verificação completa de tipos.

:::vue

`@data-client/vue` precisa do TypeScript 4.5 ou posterior, pois os próprios tipos do Vue também exigem.

:::

</details>

<details>
<summary><b>Suporte a navegadores antigos</b></summary>

Se sua aplicação tem como alvo navegadores mais antigos (de alguns anos atrás ou mais), certifique-se de carregar polyfills.
Normalmente isso é feito com [@babel/preset-env useBuiltIns: 'entry'](https://babeljs.io/docs/en/babel-preset-env#usebuiltins),
combinado com a importação do [core-js](https://www.npmjs.com/package/core-js) no ponto de entrada da sua aplicação.

Isso garante que apenas os polyfills necessários para os navegadores que você suporta sejam incluídos no bundle da sua aplicação.

Por exemplo, `TypeError: Object.hasOwn is not a function`

</details>
<details>
<summary><b>Suporte ao Internet Explorer</b></summary>

Se você encontrar `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
siga as instruções para [adicionar suporte a navegadores legados aos pacotes](../guides/legacy-browser)

</details>

:::react

<details>
<summary><b>ReactJS 16-19 e React Native</b></summary>

O ReactJS 16.2 e superior é compatível (a versão com hooks!). O React 18 oferece suporte e recursos aprimorados de [Suspense](../api/useSuspense.md).
React Native, [React Navigation](https://reactnavigation.org/) e [Expo](https://docs.expo.dev) também são compatíveis.

Se você tem um projeto funcionando com outras
bibliotecas React, [fique à vontade para compartilhar com os outros](https://github.com/reactive/data-client/discussions/2422) em nossas
discussões.

</details>

:::

:::vue

<details>
<summary><b>Vue 3</b></summary>

`@data-client/vue` é compatível com Vue 3 e é construído sobre a [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html).

</details>

:::
