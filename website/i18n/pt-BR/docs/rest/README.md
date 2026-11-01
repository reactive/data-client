---
agent_setup: true
id: README
title: Usando APIs REST com o Reactive Data Client
sidebar_label: Uso
description: Escreva APIs REST em TypeScript rapidamente usando path templates e Schemas.
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import PlaygroundTabs from '@site/src/components/PlaygroundTabs';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

<PkgTabs pkgs="@data-client/rest" />

## Defina os Resources {#define-the-resources}

[Resources](./api/resource.md) são uma coleção de métodos (`methods`) para um determinado modelo de dados (`data model`). [Entities](./api/Entity.md) e [Schemas](./api/schema.md) são o _modelo de dados_ declarativo.
[RestEndpoint](./api/RestEndpoint.md) são os [_métodos_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) sobre
esses dados.

<PlaygroundTabs
defaultValue="Class"
label="Definição de Entity"
values={[
{ label: 'Class', value: 'Class' },
{ label: 'Mixin', value: 'Mixin' },
]}>
<TabItem value="Class">

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

  static key = 'User';
}
```

```typescript title="Article"
import { Entity, resource } from '@data-client/rest';
import { User } from './User';

export class Article extends Entity {
  slug = '';
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  pk() {
    return this.slug;
  }

  static key = 'Article';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}

export const ArticleResource = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:slug',
  searchParams: {} as { userId?: string } | undefined,
  schema: Article,
  paginationField: 'page',
});
```

</TypeScriptEditor>

</TabItem>
<TabItem value="Mixin">

<TypeScriptEditor>

```typescript title="User" collapsed
import { EntityMixin } from '@data-client/rest';

export class User {
  id = '';
  username = '';
}
export class UserEntity extends EntityMixin(User) {}
```

```typescript title="Article"
import { EntityMixin, resource } from '@data-client/rest';
import { UserEntity } from './User';

export class Article {
  slug = '';
  title = '';
  content = '';
  author = UserEntity.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
}

export class ArticleEntity extends EntityMixin(Article, {
  schema: {
    author: UserEntity,
    createdAt: Temporal.Instant.from,
  },
  key: 'Article',
  pk: 'slug',
}) {}

export const ArticleResource = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:slug',
  searchParams: {} as { userId?: string } | undefined,
  schema: ArticleEntity,
  paginationField: 'page',
});
```

</TypeScriptEditor>

</TabItem>

</PlaygroundTabs>

[Entity](./api/Entity.md) é um tipo de schema que [tem uma chave primária (pk)](/docs/concepts/normalization). É isso que nos permite
[evitar a duplicação de estado](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state), uma
das principais escolhas de design que possibilitam características tão elevadas de segurança e desempenho.

O [static schema](./api/Entity.md#schema) nos permite especificar transformações declarativas, como a [desserialização automática de campos](./guides/network-transform.md#deserializing-fields) com `createdAt` e o [aninhamento do campo author](./guides/relational-data.md).

[As urls são construídas](./api/RestEndpoint.md#url) combinando o urlPrefix com [path templating](https://github.com/pillarjs/path-to-regexp).
O TypeScript exige os argumentos especificados com dois-pontos como prefixo, como `:slug` neste exemplo.

```ts
// GET http://test.com/article/use-reactive-data-client
ArticleResource.get({ slug: 'use-reactive-data-client' });
```

## Renderize os dados {#render-the-data}

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
{ label: 'Server Component', value: 'server' },
]}>
<TabItem value="Single">

```tsx
import { useSuspense } from '@data-client/react';
import { ArticleResource } from '@/resources/Article';

export default function ArticleDetail({ slug }: { slug: string }) {
  const article = useSuspense(ArticleResource.get, { slug });
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
    </article>
  );
}
```

:::info

[useSuspense()](/docs/api/useSuspense) age como [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), garantindo que os dados estejam disponíveis antes de retornar. [Saiba como declarar suas dependências de dados](/docs/getting-started/data-dependency)

:::

</TabItem>
<TabItem value="List">

```tsx
import { useSuspense } from '@data-client/react';
import { ArticleResource } from '@/resources/Article';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({ userId }: { userId?: number }) {
  const articles = useSuspense(ArticleResource.getList, { userId });
  return (
    <section>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </section>
  );
}
```

:::info

[useSuspense()](/docs/api/useSuspense) age como [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), garantindo que os dados estejam disponíveis antes de retornar. [Saiba como declarar suas dependências de dados](/docs/getting-started/data-dependency)

:::

</TabItem>
<TabItem value="server">

```tsx title="app/articles/[userId]/page.tsx"
import { useSuspense } from '@data-client/react';
import { ArticleResource } from '@/resources/Article';
import ArticleSummary from './ArticleSummary';

export default async function ArticleList({ params }: { params: { userId: number } }) {
  const articles = await ArticleResource.getList(params);
  return (
    <section>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </section>
  );
}
```

:::warning

[Server Components](/docs/guides/ssr#server-components) tornam os dados estáticos e imutáveis.

:::

</TabItem>
</Tabs>

## Altere os dados {#mutate-the-data}

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```tsx title="NewArticleForm.tsx"
import { useController } from '@data-client/react';
import { ArticleResource } from '@/resources/Article';

export default function NewArticleForm() {
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(ArticleResource.getList.push, new FormData(e.target))
      }
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[getList.push](api/resource.md#push) recebe então qualquer body `keyable` para enviar como payload e retorna uma promise que
resolve para o novo Resource criado pela API. Ele será adicionado automaticamente ao cache para que qualquer consumidor o exiba.

</TabItem>
<TabItem value="Update">

```tsx title="UpdateArticleForm.tsx"
import { useController, useSuspense } from '@data-client/react';
import { ArticleResource } from '@/resources/Article';

export default function UpdateArticleForm({ slug }: { slug: string }) {
  const article = useSuspense(ArticleResource.get, { slug });
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(ArticleResource.update, { slug }, new FormData(e.target))
      }
      initialValues={article}
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[update](api/resource.md#update) recebe então qualquer body `keyable` para enviar como payload e retorna uma promise que
recebe então qualquer body `keyable` para enviar como payload e retorna uma promise que
resolve para o novo Resource criado pela API. Ele será adicionado automaticamente ao cache para que qualquer consumidor o exiba.

</TabItem>
<TabItem value="Delete">

```tsx title="ArticleWithDelete.tsx"
import { useController } from '@data-client/react';
import { Article, ArticleResource } from '@/resources/Article';

export default function ArticleWithDelete({
  article,
}: {
  article: Article;
}) {
  const ctrl = useController();
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
      <button
        onClick={() =>
          ctrl.fetch(ArticleResource.delete, { slug: article.slug })
        }
      >
        Delete
      </button>
    </article>
  );
}
```

</TabItem>
</Tabs>

Usamos [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) no
exemplo porque ele não exige nenhuma solução opinativa de gerenciamento de estado de formulários.
Sinta-se à vontade para usar a que preferir.

[Mutações](/docs/getting-started/mutations) atualizam automaticamente _todos_ os usos, sem necessidade de
requisições adicionais.

:::tip[TypeScript 4]

Ao usar TypeScript (opcional), é necessária a versão 4.0 ou superior.

:::

## Configuração do agente de código {#agent-setup}

<SiteOnly>

Cole isto no chat do seu agent:

```prompt
Use `@data-client/rest` endpoints for this app's REST APIs, without changing how components load or store data. Install the REST setup skill first: `npx skills add reactive/data-client --skill data-client-rest-setup -y`, then read `.agents/skills/data-client-rest-setup/SKILL.md` and follow it.
```

</SiteOnly>

<AgentOnly>

Para adicionar endpoints `@data-client/rest` sem alterar como o app carrega ou armazena dados, instale a skill de configuração do REST
a partir da raiz do projeto:

```bash
npx skills add reactive/data-client --skill data-client-rest-setup -y
```

Em seguida, leia `.agents/skills/data-client-rest-setup/SKILL.md` e siga-o.

</AgentOnly>

A skill detecta o axios e segue o [Guia de migração do Axios](./guides/axios-migration.md).
