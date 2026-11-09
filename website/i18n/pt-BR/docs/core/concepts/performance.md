---
title: Desempenho
sidebar_label: Desempenho
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import PosterVideo from '@site/src/components/PosterVideo';

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
- **Escala**: Renomear um usuário com 10 mil itens armazenados e 100 renderizados.[^scaling]

Esses benchmarks medem o impacto do framework dentro de um sistema maior. Isso
os torna mais úteis como comparações entre abordagens do que como medições
absolutas do desempenho geral de uma aplicação. Nós os usamos para
orientar as otimizações da biblioteca e detectar regressões de desempenho ao longo do tempo.

[^setup]: Medido em 05/11/2026 em um Ryzen 9 7950X (64 GB, Ubuntu no WSL2, Node 26.12.1, Chromium headless do Playwright 1.64.0), com cada requisição atrasada em 40 ms mais 1 ms a cada 20 registros. Medianas de 10 a 60 amostras por cenário após o aquecimento, tomadas como a mediana de duas execuções completas. [Metodologia completa](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md).
[^config]: TanStack Query 5.96.2 (`staleTime` e `gcTime` definidos como `Infinity`), SWR 2.5.1 (revalidação ao focar, ao reconectar e quando desatualizado desativada), React 19.3.1. Após uma mutação, TanStack Query e SWR esperam a resposta e então invalidam e fazem novo fetch; o Data Client atualiza o store de forma otimista. [Detalhes da configuração](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured).
[^nav]: `list-detail-switch-10`: 21,2 ms para o Data Client, 446 ms para o TanStack Query, 452 ms para o SWR, 1.351 ms para a linha de base. Isso equivale a 63,8× a linha de base, 21,1× o TanStack Query e 21,4× o SWR.
[^mutation]: `update-entity`: 0,73 ms para o Data Client, 136 ms para o TanStack Query, 137 ms para o SWR, 135 ms para a linha de base. Os outros cenários de mutação variam de 74× a 194× a linha de base. [Todos os resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results).
[^scaling]: `update-user-10000`: 5,7 ms para o Data Client, 625 ms para o TanStack Query, 602 ms para o SWR, 606 ms para a linha de base.

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

<PosterVideo
  poster={useBaseUrl('/videos/docs/memocache-poster.jpg')}
  duration="1:59"
  volume={0.5}
  alt="A desnormalização reconstrói cada post a partir dos ids, então, sem um cache, cada escrita entrega um novo objeto a cada linha. O MemoCache indexa cada resultado pelos objetos entity que leu, mantidos de forma fraca em um WeakDependencyMap. Renomear o User 7 reconstrói os posts 1 e 2, enquanto o post 3 mantém seu objeto, e o objeto antigo do usuário é coletado pelo garbage collector junto com os posts em cache que dependiam dele. Em comparação com o normalizr em uma lista grande, a desnormalização é 1,7× mais rápida sem o cache e 11,5× mais rápida em um cache hit."
>
  <source
    src={useBaseUrl('/videos/docs/memocache.webm')}
    type='video/webm; codecs="av01.0.08M.10, opus"'
  />
  <source src={useBaseUrl('/videos/docs/memocache.mp4')} type="video/mp4" />
</PosterVideo>
