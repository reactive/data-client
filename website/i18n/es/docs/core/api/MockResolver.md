---
frameworks: [react]
title: MockResolver - Simulación de datos para React
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

&lt;MockResolver /\> permite cargar fácilmente fixtures para ver cómo se verían distintas respuestas de red.
Esto es útil tanto para [storybook](../guides/storybook.md) como para las pruebas de componentes.

## Arguments {#arguments}

### fixtures {#fixtures}

```ts
(Fixture | Interceptor<T>)[]
```

Esta prop especifica los [fixtures o interceptors](./Fixtures.md) de los que se tomarán los datos. Cada elemento representa un fetch definido por el
[Endpoint](/rest/api/Endpoint) y sus params. `Result` contiene la respuesta JSON esperada de dicho fetch.

### getInitialInterceptorData {#getinitialinterceptordata}

Función que inicializa el atributo `this` de todos los interceptors.

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

## Example {#example}

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
