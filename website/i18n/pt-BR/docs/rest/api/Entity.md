---
title: Entity - Objetos únicos declarativos para React
vue_title: Entity - Objetos únicos declarativos para Vue
sidebar_label: Entity
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# Entity

<div style={{float:'right'}}>

```ts
{
  Article: {
    '1': {
      id: '1',
      title: 'Entities define data',
    }
  }
}
```

</div>

`Entity` define um único objeto _único_.

[Entity.key](#key) + [Entity.pk()](#pk) (chave primária) viabilizam um store de [tabela de busca plana](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state), permitindo alto
desempenho, consistência dos dados e mutações atômicas.

`Entities` permitem personalizar o ciclo de vida do processamento de dados ao definir seus membros estáticos, como [schema](#schema),
e ao sobrescrever seus [métodos de ciclo de vida](#lifecycle).

## Uso {#usage}

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

  static key = 'User';
  pk() {
    return this.id;
  }
}
```

```typescript title="Article"
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Article extends Entity {
  id = '';
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Article';
  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) é uma definição declarativa dos campos a serem processados.
Neste caso, `author` é outra `Entity` a ser extraída, e `createdAt` será convertido
de string para um objeto [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

:::tip

Entities são vinculadas a Endpoints usando [resource.schema](./resource.md#schema) ou
[RestEndpoint.schema](./RestEndpoint.md#schema)

:::

:::tip

Se você já tem suas classes definidas, o [EntityMixin](./EntityMixin.md) também pode ser
usado para criar Entities.

:::

Outras sobrescritas de membros estáticos permitem personalizar o ciclo de vida dos dados, como visto abaixo.

## Membros {#members}

### pk(parent?, key?, args?): string | number | undefined {#pk}

<abbr title="Primary Key">pk</abbr> vem de [_primary key_](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS) (chave primária) e identifica de forma única uma instância de `Entity`.
Por padrão, retorna o campo `id` da Entity.

Sobrescreva este método para usar outros campos ou para outros casos, como
chaves primárias com várias colunas.

#### Valor undefined {#undefined-value}

`undefined` pode ser usado como padrão para indicar que a entity ainda não foi criada.
Isso é útil ao inicializar um formulário de criação usando [Entity.fromJS()](#fromJS)
diretamente. Se `pk()` retornar `undefined`, considera-se que a entity não foi persistida no servidor
e, portanto, ela não será mantida no cache.

#### Outros usos {#other-uses}

Como `pk()` é único, ele oferece uma forma consistente de definir :react[[keys de listas JSX](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)]:vue[[keys de `v-for`](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)]

:::react

```tsx nocheck
//....
return (
  <div>
    {results.map(result => (
      <TheThing key={result.pk()} thing={result} />
    ))}
  </div>
);
```

:::

:::vue

```html nocheck
<template>
  <div>
    <TheThing
      v-for="result in results"
      :key="result.pk()"
      :thing="result"
    />
  </div>
</template>
```

:::

#### Chaves primárias compostas {#composite-primary-keys}

Quando um único campo não basta para identificar uma entity de forma única, você pode combinar vários
campos em uma chave composta. Isso é comum em recursos aninhados ou em recursos com
identificadores de várias partes.

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = '';
  title = '';

  pk() {
    // Composite key from owner, repo, and issue number
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';
}
```

Quando os dados da entity não incluem diretamente todas as partes da chave, você pode extraí-las de campos
relacionados ou dos argumentos do endpoint usando [Entity.process()](#process):

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = ''; // Contains: https://api.github.com/repos/{owner}/{repo}
  title = '';

  pk() {
    // Use owner/repo from process() which extracts from repositoryUrl
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';

  static process(input: any, parent: any, key: string, args: any[]) {
    // Extract owner and repo from the repositoryUrl
    const match = input.repositoryUrl?.match(/repos\/([^/]+)\/([^/]+)/);
    const owner = args[0]?.owner ?? match?.[1];
    const repo = args[0]?.repo ?? match?.[2];
    return { ...input, owner, repo };
  }
}
```

#### Entities singleton {#singleton-entities}

E se existir apenas uma instância de uma Entity em toda a sua aplicação? Você
não precisa realmente distinguir entre as instâncias, então provavelmente a API não definiu um `id` ou
um campo semelhante. Nesses casos, você pode simplesmente retornar um literal como
'the_only_one'.

```typescript
pk() {
  return 'the_only_one';
}
```

Caso você tenha

```typescript
const get = new RestEndpoint({
  path: '/options',
  schema: OptionsEntity,
});
export const OptionsResource = {
  get,
  partialUpdate: get.extend({ method: 'PATCH' }),
};
```

### static key: string {#key}

Define a chave do tipo de Entity, e não de uma instância. Precisa ser um valor globalmente
único.

:::warning

O padrão é `this.name`; porém, isso pode quebrar em builds de produção que alteram nomes de classes.
Isso costuma ser conhecido como [class name mangling](https://terser.org/docs/api-reference#mangle-options).

Nesses casos, você pode sobrescrever `key` ou desativar o mangling de nomes de classes.

:::

```ts
class User extends Entity {
  id = '';
  username = '';

  pk() {
    return this.id;
  }
  // highlight-next-line
  static key = 'User';
}
```

### static schema: \{ [k: keyof this]: Schema } {#schema}

Define membros de [entities relacionadas](/rest/guides/relational-data) ou a
[desserialização de campos](/rest/guides/network-transform#deserializing-fields), como Date e BigNumber.

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/posts/:id'}),
args: [{ id: '123' }],
response: {
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
},
delay: 150,
},
]}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

```ts title="Post" {17-21}
import { Entity } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';
import { User } from './User';

export class Post extends Entity {
  id = '';
  author = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  pk() {
    return this.id;
  }
  static key = 'Post';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

:::react

```tsx title="PostPage" collapsed
import { RestEndpoint } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { Post } from './Post';

export const getPost = new RestEndpoint({
  path: '/posts/:id',
  schema: Post,
});
function PostPage() {
  const post = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>{post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}</time>
    </div>
  );
}
render(<PostPage />);
```

:::

:::vue

```html title="PostPage.vue" collapsed
<script lang="ts">
  import { RestEndpoint } from '@data-client/rest';
  import { Post } from './Post';

  const getPost = new RestEndpoint({
    path: '/posts/:id',
    schema: Post,
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';

  const post = await useSuspense(getPost, { id: '123' });
</script>

<template>
  <div>
    <p>{{ post.content }} - <cite>{{ post.author.name }}</cite></p>
    <time>
      {{ post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
    </time>
  </div>
</template>
```

:::

</FrameworkPlayground>

#### Membros opcionais {#optional-members}

Referências a Entities cujos valores padrão na própria definição do Record são
consideradas 'opcionais'

```typescript
class User extends Entity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### static indexes?: (keyof this)[] {#indexes}

Os índices aumentam o desempenho de buscas baseadas nesses parâmetros. Adicione à lista
os nomes de campos (como `slug`, `username`) que você quiser enviar como parâmetros para buscas
posteriores.

:::note

Não adicione sua chave primária, como `id`, à lista de índices, pois ela já é otimizada.

:::

#### useSuspense() {#usesuspense}

Com [useSuspense()](/docs/api/useSuspense), isso inferirá antecipadamente os resultados a partir da tabela de entities, se possível,
renderizando sem precisar esperar a conclusão do fetch. Isso costuma ser útil quando o cache
de entities já foi preenchido por outra requisição, como a de uma lista.

```typescript
export class User extends Entity {
  id: number | undefined = undefined;
  username = '';
  email = '';
  isAdmin = false;

  // highlight-next-line
  static indexes = ['username' as const];
}
export const UserResource = resource({
  path: '/user/:id',
  schema: User,
});
```

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { UserResource } from './resources/User';

const user = useSuspense(UserResource.get, { username: 'bob' });
```

:::

:::vue

```ts
const user = await useSuspense(UserResource.get, { username: 'bob' });
```

:::

#### useQuery() {#usequery}

Com [useQuery()](/docs/api/useQuery), isso permite acessar resultados obtidos dentro de outras requisições - mesmo
que não exista um endpoint de onde ele possa ser buscado.

```typescript
class LatestPrice extends Entity {
  id = '';
  symbol = '';
  price = '0.0';

  static indexes = ['symbol' as const];
}
```

```typescript
class Asset extends Entity {
  id = '';
  price = '';

  static schema = {
    price: LatestPrice,
  };
}
const getAssets = new RestEndpoint({
  path: '/assets',
  schema: [Asset],
});
```

Algum componente de nível superior:

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { getAssets } from './resources/Asset';

const assets = useSuspense(getAssets);
```

:::

:::vue

```ts
const assets = await useSuspense(getAssets);
```

:::

Aninhado abaixo:

```tsx
import { useQuery } from '@data-client/react';
import { LatestPrice } from './resources/LatestPrice';

const price = useQuery(LatestPrice, { symbol: 'BTC' });
```

### static maxEntityDepth?: number {#maxEntityDepth}

Limita a profundidade de aninhamento de entities durante a desnormalização para evitar estouro de pilha
em grafos de entities bidirecionais grandes. **Padrão: 64**

Quando relacionamentos bidirecionais criam cadeias com muitas entities únicas
(por exemplo, `Department → Building → Department → ...`), a desnormalização pode recursar
por milhares de níveis. `maxEntityDepth` interrompe a resolução na profundidade
especificada — entities além do limite são retornadas com as chaves estrangeiras aninhadas mantidas como
ids não resolvidos, em vez de objetos totalmente desnormalizados.

```typescript
class Department extends Entity {
  id = '';
  name = '';
  buildings: Building[] = [];

  pk() {
    return this.id;
  }
  static key = 'Department';
  // highlight-next-line
  static maxEntityDepth = 16;

  static schema = {
    buildings: [Building],
  };
}
```

:::tip

Defina isto nas entities que participam de relacionamentos bidirecionais profundos ou amplos.
Grafos de entities normais (profundidade < 10) nunca se aproximam do limite padrão.

Para relacionamentos que não precisam de desnormalização antecipada, [Lazy](/rest/api/Lazy)
ignora a resolução por completo e permite resolver sob demanda via [useQuery](/docs/api/useQuery).

:::

## Ciclo de vida {#lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="Entity" />
