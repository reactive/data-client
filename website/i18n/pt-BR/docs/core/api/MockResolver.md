---
frameworks: [react]
title: MockResolver - Mock de dados para React
sidebar_label: <MockResolver />
---

# &lt;MockResolver />

```typescript
function MockResolver<T>(props: {
  children: React.ReactNode;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData: () => T;
}): JSX.Element;
```

&lt;MockResolver /\> permite carregar fixtures com facilidade para ver como diferentes respostas de rede podem ser.
Isso é útil tanto para o [storybook](../guides/storybook.md) quanto para testes de componentes.

## Argumentos {#arguments}

### fixtures {#fixtures}

```ts
(Fixture | Interceptor<T>)[]
```

Esta prop especifica as [fixtures ou interceptors](./Fixtures.md) dos quais usar os dados. Cada item representa um fetch definido pelo
[Endpoint](/rest/api/Endpoint) e pelos params. `Result` contém a resposta JSON esperada desse fetch.

### getInitialInterceptorData {#getinitialinterceptordata}

Função que inicializa o atributo `this` de todos os interceptors.

```ts
<MockResolver
  fixtures={[
    {
      endpoint: new RestEndpoint({
        path: '/api/count/increment',
        method: 'POST',
        body: undefined,
      }),
      response() {
        return {
          // highlight-next-line
          count: (this.count = this.count + 1),
        };
      },
      delay: () => 500 + Math.random() * 4500,
    },
  ]}
  // highlight-next-line
  getInitialInterceptorData={() => ({ count: 0 })}
>
  {children}
</MockResolver>
```

## Exemplo {#example}

```tsx
import { MockResolver } from '@data-client/test';
import type { Story } from '@storybook/react';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  // fixture
  {
    endpoint: ArticleResource.getList,
    args: [{ maxResults: 10 }] as const,
    response: [
      {
        id: 5,
        content: 'have a merry christmas',
        author: 2,
        contributors: [],
      },
      {
        id: 532,
        content: 'never again',
        author: 23,
        contributors: [5],
      },
    ],
  },
  // interceptor
  {
    endpoint: ArticleResource.partialUpdate,
    response: ({ id }, body) => ({
      ...body,
      id,
    }),
  },
];

const Template: Story = () => (
  <MockResolver fixtures={results}>
    <MyComponentToTest />
  </MockResolver>
);

export const MyStory = Template.bind({});
```
