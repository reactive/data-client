---
title: Performance
sidebar_label: Performance
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

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
- **Escalado**: Mutaciones con 10 mil elementos renderizados en la lista.[^scaling]

Estos benchmarks miden el impacto del framework dentro del sistema general. Eso
los hace más útiles como comparaciones entre enfoques que como
mediciones absolutas del rendimiento global de una aplicación. Los usamos para
guiar las optimizaciones de la biblioteca y detectar regresiones de rendimiento a lo largo del tiempo.

[^setup]: Medido el 2026-03-22 en un Ryzen 9 7950X (64 GB, Ubuntu en WSL2, Node 24.12.0, Chromium sin interfaz de Playwright 1.58.2), con cada solicitud retrasada 40 ms más 1 ms por cada 20 registros. Medianas de 5 a 50 muestras por escenario después del calentamiento. [Metodología completa](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md).
[^config]: TanStack Query 5.62.7 (`staleTime` y `gcTime` establecidos en `Infinity`), SWR 2.4.1 (revalidación al enfocar, al reconectar y por datos obsoletos deshabilitada), React 19.2.3. Después de una mutación, TanStack Query y SWR esperan la respuesta y luego invalidan y vuelven a obtener los datos; Data Client actualiza el store de forma optimista. [Detalles de la configuración](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#how-each-library-is-configured).
[^nav]: `list-detail-switch-10`: 57.5 ms para Data Client, 610 ms para TanStack Query, 629 ms para SWR, 1,370 ms para la línea base. Es 23.8× la línea base, 10.6× TanStack Query y 10.9× SWR.
[^mutation]: `update-entity`: 1.5 ms para Data Client, 143 ms para TanStack Query, 141 ms para SWR, 138 ms para la línea base. Otros escenarios de mutación van de 48× a 116× la línea base. [Todos los resultados](https://github.com/reactive/data-client/blob/master/examples/benchmark-react/METHODOLOGY.md#results).
[^scaling]: `update-user-10000`: 6.9 ms para Data Client, 671 ms para TanStack Query, 641 ms para SWR, 641 ms para la línea base.

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