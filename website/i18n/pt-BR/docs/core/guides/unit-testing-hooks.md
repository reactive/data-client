---
frameworks: [react]
title: Testes unitários de hooks
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

Tenha cuidado com o [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) em módulos do Reactive Data
Client. Um mock que remove exports causa erros difíceis de rastrear, como
`TypeError: Class extends value undefined is not a function or null`.

Use um [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials) em vez disso ou, melhor ainda,
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) nos seus endpoints.

:::

O [renderDataHook()](../api/renderDataHook.md) renderiza um hook dentro de um `DataProvider` e de um boundary `Suspense`. Com React
18 ou posterior, ele envolve o `renderHook()` do [@testing-library/react](https://testing-library.com/docs/react-testing-library/api#renderhook)
em um ambiente DOM, ou o do [@testing-library/react-native](https://github.com/callstack/react-native-testing-library) no React Native. Caso contrário, usa
[@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library).

`result.current` é `undefined` até o hook retornar pela primeira vez. Se ele suspender de novo mais tarde, `result.current` mantém o último
valor. `result.error` guarda qualquer erro lançado pelo hook.

Cada chamada a `renderDataHook()` cria um novo store e novas instâncias de manager, então nenhum estado é mantido entre os testes.
Use `initialFixtures` para preparar o cache. A limpeza é executada automaticamente após cada teste.

### Polyfill de fetch {#polyfill-fetch}

O ambiente `jsdom` do Jest não tem um `fetch` global, mesmo no Node 18 e posterior. Adicione um polyfill:

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

### Exemplo {#example}

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
