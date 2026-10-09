---
title: Desempenho
sidebar_label: Desempenho
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>


Além dos benefícios para a integridade dos dados, o [cache normalizado](./normalization.md) com memoização em nível de entity permite
ganhos significativos de desempenho em aplicações interativas e ricas.

## Benchmarks de renderização do React {#react-rendering-benchmarks}

Pipeline de renderização completo (do fetch ao commit no DOM) medido em um navegador real via Playwright.[^setup]
A linha de base do React usa useEffect + useState, como na documentação do React.[^config]

<center>

<ThemedImage
alt="Benchmarks de renderização do React"
title="Data Client vs TanStack Query, SWR e linha de base"
sources={{
    light: useBaseUrl('/img/bench-react.svg'),
    dark: useBaseUrl('/img/bench-react-dark.svg'),
  }}
/>

[Ver código-fonte do benchmark](https://github.com/reactive/data-client/tree/master/examples/benchmark-react) · [Metodologia e resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md) · [Desempenho ao longo do tempo](https://reactive.github.io/data-client/react-bench/)

</center>

- **Navegação em cache**: Navegar dez vezes entre uma lista completa e os itens da lista.[^nav]
- **Propagação de mutações**: Uma única escrita no store atualiza todas as views que referenciam a entity.[^mutation]
- **Escala**: Mutações com 10 mil itens renderizados na lista.[^scaling]

Esses benchmarks medem o impacto do framework dentro de um sistema maior. Isso
os torna mais úteis como comparações entre abordagens do que como medições
absolutas do desempenho geral de uma aplicação. Nós os usamos para
orientar as otimizações da biblioteca e detectar regressões de desempenho ao longo do tempo.

[^setup]: Medido em 22/03/2026 em um Ryzen 9 7950X (64 GB, Ubuntu no WSL2, Node 24.12.0, Chromium headless do Playwright 1.58.2), com cada requisição atrasada em 40 ms mais 1 ms a cada 20 registros. Medianas de 5 a 50 amostras por cenário após o aquecimento. [Metodologia completa](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md).
[^config]: TanStack Query 5.62.7 (`staleTime` e `gcTime` definidos como `Infinity`), SWR 2.4.1 (revalidação ao focar, ao reconectar e quando desatualizado desativada), React 19.2.3. Após uma mutação, TanStack Query e SWR esperam a resposta e então invalidam e fazem novo fetch; o Data Client atualiza o store de forma otimista. [Detalhes da configuração](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured).
[^nav]: `list-detail-switch-10`: 57,5 ms para o Data Client, 610 ms para o TanStack Query, 629 ms para o SWR, 1.370 ms para a linha de base. Isso equivale a 23,8× a linha de base, 10,6× o TanStack Query e 10,9× o SWR.
[^mutation]: `update-entity`: 1,5 ms para o Data Client, 143 ms para o TanStack Query, 141 ms para o SWR, 138 ms para a linha de base. Os outros cenários de mutação variam de 48× a 116× a linha de base. [Todos os resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results).
[^scaling]: `update-user-10000`: 6,9 ms para o Data Client, 671 ms para o TanStack Query, 641 ms para o SWR, 641 ms para a linha de base.

## Benchmarks de normalização {#normalization-benchmarks}

Desnormalização comparada com a biblioteca legada [normalizr](https://github.com/paularmstrong/normalizr).
A memoização em nível de entity mantém a igualdade referencial global e
acelera acessos repetidos, inclusive após [mutações](../getting-started/mutations.md).

<center>

<ThemedImage
alt="Benchmarks de desnormalização"
title="Data Client vs normalizr"
sources={{
    light: useBaseUrl('/img/bench-norm.svg'),
    dark: useBaseUrl('/img/bench-norm-dark.svg'),
  }}
/>

[Ver código-fonte do benchmark](https://github.com/reactive/data-client/blob/master/examples/benchmark) · [Metodologia](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#normalization-benchmarks)

</center>
