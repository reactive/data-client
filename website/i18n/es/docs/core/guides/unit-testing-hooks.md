---
frameworks: [react]
title: Pruebas unitarias de hooks
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

Ten cuidado al usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) en módulos como Reactive Data Client. Eliminar exports esperados
puede provocar errores difíciles de rastrear
como `TypeError: Class extends value undefined is not a function or null`.

En su lugar, haz un [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials)
o, mejor aún, usa [mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) en tus
endpoints.

:::

Los hooks te permiten extraer comportamientos complejos de tus componentes hacia funciones
concisas y componibles. Esto puede facilitar mucho las pruebas del comportamiento de los componentes. Pero ¿cómo funciona
si quieres usar hooks de `Reactive Data Client`?

Hemos creado algunas utilidades simples para reducir el código repetitivo de las pruebas unitarias,
que envuelven el [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) de [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library).

Queremos una función [renderDataHook()](../api/renderDataHook.md) que renderice en el contexto de
un `Provider` y de un límite `Suspense`.

Normalmente esto se hace durante la configuración de las pruebas. La limpieza se ejecuta automáticamente después de cada prueba.

:::note

`renderDataHook()` crea un contexto de Provider con nuevas instancias de los managers. Esto significa que cada llamada
a `renderDataHook()` producirá un estado de caché y un estado de managers completamente nuevos.

:::

### Polyfill de fetch en node &lt; 18 {#polyfill-fetch-in-node-lt-18}

Node no incluye fetch de fábrica, así que debemos asegurarnos de agregarle un polyfill.

<PkgTabs pkgs="whatwg-fetch" dev />

### Jest {#jest}

```js
// jest.config.js
module.exports = {
  // other things
  setupFiles: ['./testSetup.js'],
};
```

```js
// testSetup.js
require('whatwg-fetch');
```

### Ejemplo: {#example}

<Tabs
defaultValue="DataProvider"
values={[
{ label: '@data-client/react', value: 'DataProvider' },
{ label: '@data-client/react/redux', value: 'ExternalDataProvider' },
]}>
<TabItem value="DataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
<TabItem value="ExternalDataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { makeRenderDataHook } from '@data-client/test';
import { DataProvider } from '@data-client/react/redux';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  let renderDataHook: ReturnType<typeof makeRenderDataHook>;

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
    renderDataHook = makeRenderDataHook(DataProvider);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
</Tabs>
