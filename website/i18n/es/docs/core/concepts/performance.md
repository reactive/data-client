---
title: Performance
sidebar_label: Performance
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import PosterVideo from '@site/src/components/PosterVideo';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>


Además de los beneficios para la integridad de los datos, la [caché normalizada](./normalization.md) con memoización a nivel de entity permite
mejoras de rendimiento significativas en aplicaciones interactivas ricas.

## Benchmarks de renderizado de React {#react-rendering-benchmarks}

Se mide el pipeline de renderizado completo (desde el fetch hasta el commit al DOM) en un navegador real mediante Playwright.[^setup]
La línea base de React usa useEffect + useState de la documentación de React.[^config]

<center>

<ThemedImage
alt="Benchmarks de renderizado de React"
title="Data Client frente a TanStack Query, SWR y la línea base"
sources={{
    light: useBaseUrl('/img/bench-react.svg'),
    dark: useBaseUrl('/img/bench-react-dark.svg'),
  }}
/>

[Ver el código fuente del benchmark](https://github.com/reactive/data-client/tree/master/examples/benchmark-react) · [Metodología y resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md) · [Rendimiento a lo largo del tiempo](https://reactive.github.io/data-client/react-bench/)

</center>

- **Navegación con caché**: Navegar diez veces entre una lista completa y los elementos de la lista.[^nav]
- **Propagación de mutaciones**: Una sola escritura en el store actualiza todas las vistas que hacen referencia a la entity.[^mutation]
- **Escalado**: Renombrar un usuario con 10 mil elementos almacenados y 100 renderizados.[^scaling]

Estos benchmarks miden el impacto del framework dentro del sistema general. Eso
los hace más útiles como comparaciones entre enfoques que como
mediciones absolutas del rendimiento global de una aplicación. Los usamos para
guiar las optimizaciones de la biblioteca y detectar regresiones de rendimiento a lo largo del tiempo.

[^setup]: Medido el 2026-11-05 en un Ryzen 9 7950X (64 GB, Ubuntu en WSL2, Node 26.12.1, Chromium sin interfaz de Playwright 1.64.0), con cada solicitud retrasada 40 ms más 1 ms por cada 20 registros. Medianas de 10 a 60 muestras por escenario después del calentamiento, tomadas como la mediana de dos ejecuciones completas. [Metodología completa](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md).
[^config]: TanStack Query 5.96.2 (`staleTime` y `gcTime` establecidos en `Infinity`), SWR 2.5.1 (revalidación al enfocar, al reconectar y por datos obsoletos deshabilitada), React 19.3.1. Después de una mutación, TanStack Query y SWR esperan la respuesta y luego invalidan y vuelven a obtener los datos; Data Client actualiza el store de forma optimista. [Detalles de la configuración](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured).
[^nav]: `list-detail-switch-10`: 21.2 ms para Data Client, 446 ms para TanStack Query, 452 ms para SWR, 1,351 ms para la línea base. Es 63.8× la línea base, 21.1× TanStack Query y 21.4× SWR.
[^mutation]: `update-entity`: 0.73 ms para Data Client, 136 ms para TanStack Query, 137 ms para SWR, 135 ms para la línea base. Otros escenarios de mutación van de 74× a 194× la línea base. [Todos los resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results).
[^scaling]: `update-user-10000`: 5.7 ms para Data Client, 625 ms para TanStack Query, 602 ms para SWR, 606 ms para la línea base.

## Benchmarks de normalización {#normalization-benchmarks}

Desnormalización comparada con la biblioteca [normalizr](https://github.com/paularmstrong/normalizr),
ya heredada. La memoización a nivel de entity mantiene la igualdad referencial global y
acelera los accesos repetidos, incluso después de [mutaciones](../getting-started/mutations.md).

<center>

<ThemedImage
alt="Benchmarks de desnormalización"
title="Data Client frente a normalizr"
sources={{
    light: useBaseUrl('/img/bench-norm.svg'),
    dark: useBaseUrl('/img/bench-norm-dark.svg'),
  }}
/>

[Ver el código fuente del benchmark](https://github.com/reactive/data-client/blob/master/examples/benchmark) · [Metodología](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#normalization-benchmarks)

</center>

<PosterVideo
  poster={useBaseUrl('/videos/docs/memocache-poster.jpg')}
  duration="1:59"
  volume={0.5}
  alt="La desnormalización reconstruye cada post a partir de ids, así que sin caché cada escritura entrega un objeto nuevo a cada fila. MemoCache indexa cada resultado por los objetos entity que leyó, retenidos débilmente en un WeakDependencyMap. Al renombrar al User 7 se reconstruyen los posts 1 y 2, mientras que el post 3 conserva su objeto, y el objeto de usuario anterior se recolecta como basura junto con los posts cacheados detrás de él. Frente a normalizr en una lista grande, desnormalizar es 1,7× más rápido sin la caché y 11,5× más rápido con un acierto de caché."
>
  <source
    src={useBaseUrl('/videos/docs/memocache.webm')}
    type='video/webm; codecs="av01.0.08M.10, opus"'
  />
  <source src={useBaseUrl('/videos/docs/memocache.mp4')} type="video/mp4" />
</PosterVideo>