---
frameworks: [react]
title: Testes unitários de hooks
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

Tenha cuidado ao usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) em módulos como o Reactive Data Client. Eliminar exports esperados
pode levar a erros difíceis de rastrear,
como `TypeError: Class extends value undefined is not a function or null`.

Em vez disso, faça um [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials)
ou, melhor ainda, use [mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) nos seus
endpoints.

:::

Hooks permitem extrair comportamentos complexos dos seus componentes para funções concisas e
componíveis. Isso pode facilitar muito o teste do comportamento dos componentes. Mas como isso funciona se você quiser usar hooks do `Reactive Data Client`?

Fornecemos alguns utilitários simples para reduzir o código boilerplate dos testes unitários,
que são wrappers em torno do [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) do [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library).

Queremos uma função [renderDataHook()](../api/renderDataHook.md) que renderize no contexto tanto de
um `Provider` quanto de um limite de `Suspense`.

Isso geralmente é feito durante a configuração dos testes. A limpeza é executada automaticamente após cada teste.

:::note

`renderDataHook()` cria um contexto de Provider com novas instâncias de manager. Isso significa que cada chamada
de `renderDataHook()` resultará em um estado de cache totalmente novo, assim como um estado de manager novo.

:::

### Polyfill de fetch no node &lt; 18 {#polyfill-fetch-in-node-lt-18}

O Node não vem com fetch por padrão, então precisamos garantir que ele receba um polyfill.

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

### Exemplo: {#example}

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
