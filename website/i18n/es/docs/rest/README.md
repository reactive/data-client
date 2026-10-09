---
id: README
title: Uso de APIs REST con Reactive Data Client
sidebar_label: Uso
description: Escribe APIs REST en TypeScript rápidamente con plantillas de rutas y Schemas.
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import Link from '@docusaurus/Link';

<PkgTabs pkgs="@data-client/rest" />

## Define los Resources {#define-the-resources}

Los [Resources](./api/resource.md) son una colección de `methods` (métodos) para un `data model` (modelo de datos) dado. Las [Entities](./api/Entity.md) y los [Schemas](./api/schema.md) son el _modelo de datos_ declarativo.
Los [RestEndpoint](./api/RestEndpoint.md) son los [_métodos_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) sobre
esos datos.

<Tabs
defaultValue="Class"
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

</Tabs>

[Entity](./api/Entity.md) es un tipo de schema que [tiene una clave primaria (pk)](/docs/concepts/normalization). Esto es lo que nos permite
[evitar la duplicación de estado](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state), que
es una de las decisiones de diseño centrales que permiten unas características de seguridad y rendimiento tan altas.

[static schema](./api/Entity.md#schema) nos permite especificar transformaciones declarativas, como la [deserialización automática de campos](./guides/network-transform.md#deserializing-fields) con `createdAt` y el [anidamiento del campo author](./guides/relational-data.md).

[Las URLs se construyen](./api/RestEndpoint.md#url) combinando el urlPrefix con [plantillas de rutas](https://github.com/pillarjs/path-to-regexp).
TypeScript exige los argumentos especificados con dos puntos como prefijo, como `:slug` en este ejemplo.

```ts
// GET http://test.com/article/use-reactive-data-client
ArticleResource.get({ slug: 'use-reactive-data-client' });
```

## Renderiza los datos {#render-the-data}

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

[useSuspense()](/docs/api/useSuspense) actúa como [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) y se asegura de que los datos estén disponibles antes de devolver. [Aprende a declarar tus dependencias de datos](/docs/getting-started/data-dependency)

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

[useSuspense()](/docs/api/useSuspense) actúa como [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) y se asegura de que los datos estén disponibles antes de devolver. [Aprende a declarar tus dependencias de datos](/docs/getting-started/data-dependency)

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

Los [Server Components](/docs/guides/ssr#server-components) hacen que los datos sean estáticos e inmutables.

:::

</TabItem>
</Tabs>

## Muta los datos {#mutate-the-data}

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

[getList.push](api/resource.md#push) toma entonces cualquier cuerpo `keyable` para enviarlo como payload y devuelve una promesa que
se resuelve con el nuevo Resource creado por la API. Se añadirá automáticamente a la caché para que lo muestre cualquier consumidor.

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

[update](api/resource.md#update) toma entonces cualquier cuerpo `keyable` para enviarlo como payload y devuelve una promesa que
toma entonces cualquier cuerpo `keyable` para enviarlo como payload y devuelve una promesa que
se resuelve con el nuevo Resource creado por la API. Se añadirá automáticamente a la caché para que lo muestre cualquier consumidor.

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

Usamos [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) en
el ejemplo porque no requiere ninguna solución de gestión del estado de formularios con opiniones propias.
Siéntete libre de usar la que prefieras.

Las [mutaciones](/docs/getting-started/mutations) actualizan automáticamente _todos_ los usos sin necesidad de
peticiones adicionales.

:::tip[TypeScript 4]

Si usas TypeScript (opcional), se requiere la versión 4.0 o superior.

:::

## Agent Skills de REST {#rest-agent-skills}

import SkillTabs from '@site/src/components/SkillTabs';

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

Después, llama a `/data-client-rest-setup` para migrar

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary button--sm" to="https://skills.sh/reactive/data-client/data-client-rest"><img src="/img/anthropic.svg" alt="REST Codegen Skill" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> REST Codegen Skill</Link>
</div>

### Migrar desde Axios {#migrating-from-axios}

El skill `data-client-rest-setup` detecta automáticamente el uso de axios y aplica la migración de axios, incluyendo el [codemod](./guides/axios-migration.md#codemod), la conversión de interceptores y la migración del manejo de errores.

Consulta la [guía de migración de Axios](./guides/axios-migration.md) completa para ver ejemplos paso a paso, una tabla de referencia rápida y un codemod independiente.