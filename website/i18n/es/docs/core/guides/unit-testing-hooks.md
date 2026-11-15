---
frameworks: [react]
title: Pruebas unitarias de hooks
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

Ten cuidado con [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) en los módulos de Reactive Data
Client. Un mock que elimina exports provoca errores difíciles de rastrear, como
`TypeError: Class extends value undefined is not a function or null`.

En su lugar, usa un [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials) o, mejor aún,
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) en tus endpoints.

:::

[renderDataHook()](../api/renderDataHook.md) renderiza un hook dentro de un `DataProvider` y un límite `Suspense`. Con React
18 o posterior, envuelve el `renderHook()` de [@testing-library/react](https://testing-library.com/docs/react-testing-library/api#renderhook)
en un entorno DOM, o el de [@testing-library/react-native](https://github.com/callstack/react-native-testing-library) en React Native. En otro caso usa
[@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library).

`result.current` es `undefined` hasta que el hook devuelve un valor por primera vez. Si vuelve a suspenderse más tarde, `result.current` conserva el último
valor. `result.error` contiene cualquier error que lance el hook.

Cada llamada a `renderDataHook()` crea un store nuevo y nuevas instancias de los managers, así que ningún estado pasa de una prueba a otra.
Usa `initialFixtures` para precargar la caché. La limpieza se ejecuta automáticamente después de cada prueba.

### Polyfill de fetch {#polyfill-fetch}

El entorno `jsdom` de Jest no tiene un `fetch` global, ni siquiera en Node 18 y posteriores. Agrega un polyfill:

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

### Ejemplo {#example}

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
