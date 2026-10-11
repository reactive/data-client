---
title: Testes unitários de componentes
---

import PkgTabs from '@site/src/components/PkgTabs';

:::warning

Tenha cuidado ao usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) em módulos como o Reactive Data Client. Eliminar exports esperados
pode levar a erros difíceis de rastrear,
como `TypeError: Class extends value undefined is not a function or null`.

Em vez disso, carregue as respostas com [Fixtures](../api/Fixtures.md).

:::

`@data-client/vue/test` monta componentes com o [DataClientPlugin](../api/DataClientPlugin.md),
um limite `<Suspense>` e [Fixtures](../api/Fixtures.md), de modo que os testes possam verificar o que um componente
renderiza sem um ciclo de fetch de rede. Para composables isolados, veja
[Testes unitários de composables](./unit-testing-composables.md).

## Configuração {#setup}

Os utilitários de teste são construídos sobre o [Vue Test Utils](https://test-utils.vuejs.org/), então instale-o
junto com seu test runner. O Jest precisa do [ambiente jsdom](https://jestjs.io/docs/configuration#testenvironment-string).

<PkgTabs pkgs="@vue/test-utils jest-environment-jsdom" dev />

## mountDataClient() {#mountdataclient}

[initialFixtures](#options)
preenchem o store antes da primeira renderização, de modo que um componente que faz `await`
em [useSuspense()](../api/useSuspense.md) renderize seus dados imediatamente.

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { defineComponent, h } from 'vue';
import { ArticleResource } from './resources';
import { flushUntil } from './flushUntil';

const ArticleDetail = defineComponent({
  props: { id: { type: Number, required: true } },
  async setup(props) {
    // a getter so the fetch follows props.id
    const article = await useSuspense(ArticleResource.get, () => ({
      id: props.id,
    }));
    return () => h('h3', article.value.title);
  },
});

it('renders the article', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');

  cleanup();
});
```

Sempre chame `cleanup()` ao final de um teste; ele desmonta o app e seus managers.

### Aguardando renderizações {#waiting-for-renders}

`setup()` assíncrono e Suspense são resolvidos ao longo de várias microtasks e ticks, então aguarde o que o
teste espera em vez de um número fixo de ticks:

```typescript title="flushUntil.ts"
import { nextTick } from 'vue';

export async function flushUntil(predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('flushUntil: condition never became true');
}
```

### Estado de carregamento {#loading-state}

Enquanto um componente está suspenso, `mountDataClient()` renderiza um elemento com
`data-testid="suspense-fallback"`. Use [resolverFixtures](#options) para responder aos fetches que o store
ainda não tem:

```typescript
it('shows the fallback until the fetch resolves', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(true);

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('Article 5');

  cleanup();
});
```

O `response` de um interceptor recebe os argumentos do endpoint, então uma única fixture pode responder a todo
`id`. Adicione `error: true` a uma fixture para fazê-la rejeitar; veja [Fixtures](../api/Fixtures.md) para todos os
formatos de fixture.

### Alterando props {#changing-props}

Passe um objeto `reactive()` como `props` e depois altere seus membros para mudar as props do componente:

```typescript
import { reactive } from 'vue';

it('fetches the new article when id changes', async () => {
  const props = reactive({ id: 1 });
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props,
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  await flushUntil(() => wrapper.text() === 'Article 1');

  props.id = 2;
  await flushUntil(() => wrapper.text() === 'Article 2');

  cleanup();
});
```

Um `setup()` assíncrono é executado uma vez por instância do componente, então passe argumentos derivados de props como um getter
(`() => ({ id: props.id })`) ou `computed()`. Um simples `{ id: props.id }` é lido uma única vez e não
acompanha as mudanças de props.

### Mutações {#mutations}

O `controller` retornado é o [Controller](../api/Controller.md) do app. Execute mutações ou
[setResponse()](../api/Controller.md#setResponse) com ele e depois aguarde o componente ser atualizado:

```typescript
it('re-renders when the store changes', async () => {
  const { wrapper, controller, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });
  await flushUntil(() => wrapper.find('h3').exists());

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );

  await flushUntil(() => wrapper.find('h3').text() === 'updated');
  cleanup();
});
```

## API {#api}

### mountDataClient(component, options?) {#mountdataclient-api}

Retorna

| Membro         | Descrição                                                    |
| -------------- | ------------------------------------------------------------ |
| `wrapper`      | [VueWrapper](https://test-utils.vuejs.org/api/#wrapper-methods) do Vue Test Utils da árvore montada |
| `controller`   | O [Controller](../api/Controller.md) do app                  |
| `app`          | A instância do app Vue                                       |
| `cleanup()`    | Desmonta e interrompe os managers                            |
| `allSettled()` | Resolve quando todo fetch em andamento é concluído, incluindo fetches que uma mudança de prop acabou de iniciar, e o componente é renderizado novamente |

### Options {#options}

`mountDataClient()` e [renderDataCompose()](./unit-testing-composables.md) recebem as mesmas opções.

```typescript
interface RenderDataClientOptions<P = any> {
  /** Props for the component; pass a reactive() object to change them */
  props?: Reactive<P>;
  /** Responses in the store before the first render */
  initialFixtures?: readonly Fixture[];
  /** Answer fetches made during the test */
  resolverFixtures?: readonly (Fixture | Interceptor)[];
  /** Initial `this` for interceptors */
  getInitialInterceptorData?: () => any;
  /** Replace the default NetworkManager and SubscriptionManager */
  managers?: Manager[];
  /** Replace the state built from initialFixtures */
  initialState?: State<unknown>;
  gcPolicy?: GCInterface;
  /** Component rendered around the tested component (receives the same props) */
  wrapper?: Component;
}
```

[mockInitialState()](../api/mockInitialState.md) constrói o `initialState` a partir de fixtures, para
montar com a sua própria configuração do `DataClientPlugin`.
