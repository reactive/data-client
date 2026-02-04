---
id: README
title: Using REST APIs with Reactive Data Client
sidebar_label: Usage
description: Writing TypeScript REST APIs quickly using path templates and Schemas.
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import Link from '@docusaurus/Link';

<PkgTabs pkgs="@data-client/rest" />

## Define the Resources

[Resources](./api/resource.md) are a collection of `methods` for a given `data model`. [Entities](./api/Entity.md) and [Schemas](./api/schema.md) are the declarative _data model_.
[RestEndpoint](./api/RestEndpoint.md) are the [_methods_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) on
that data.

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

[Entity](./api/Entity.md) is a kind of schema that [has a primary key (pk)](/docs/concepts/normalization). This is what allows us
to [avoid state duplication](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state), which
is one of the core design choices that enable such high safety and performance characteristics.

[static schema](./api/Entity.md#schema) lets us specify declarative transformations like auto [field deserialization](./guides/network-transform.md#deserializing-fields) with `createdAt` and [nesting the author field](./guides/relational-data.md).

[Urls are constructed](./api/RestEndpoint.md#url) by combining the urlPrefix with [path templating](https://www.npmjs.com/package/path-to-regexp).
TypeScript enforces the arguments specified with a prefixed colon like `:slug` in this example.

```ts
// GET http://test.com/article/use-reactive-data-client
ArticleResource.get({ slug: 'use-reactive-data-client' });
```

## Render the data

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

[useSuspense()](/docs/api/useSuspense) acts like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), ensuring the data is available before returning. [Learn how to be declare your data dependencies](/docs/getting-started/data-dependency)

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

[useSuspense()](/docs/api/useSuspense) acts like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), ensuring the data is available before returning. [Learn how to be declare your data dependencies](/docs/getting-started/data-dependency)

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

[Server Components](/docs/guides/ssr#server-components) makes the data static and un-mutable.

:::

</TabItem>
</Tabs>

## Mutate the data

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

[getList.push](api/resource.md#push) then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

</TabItem>
<TabItem value="Update">

```tsx title="UpdateArticleForm.tsx"
import { useController } from '@data-client/react';
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

[update](api/resource.md#update) then takes any `keyable` body to send as the payload and then returns a promise that
then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

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

We use [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) in
the example since it doesn't require any opinionated form state management solution.
Feel free to use whichever one you prefer.

[Mutations](/docs/getting-started/mutations) automatically updates _all_ usages without the need for
additional requests.

:::tip TypeScript 4

When using TypeScript (optional), version 4.0 or above is required.

:::


<p>
<center>
<Link className="button button--secondary button--sm" to="https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen"><img src="/img/gpt.svg" alt="Codegen GPT" style={{
          height: '1em',              // Match font size
          verticalAlign: '-0.125em',  // Fine-tune: try -0.125em or 'middle'
          display: 'inline',          // Inline with text
        }}
/> Codegen</Link>&nbsp;
<Link className="button button--secondary button--sm" to="https://github.com/reactive/data-client/blob/master/.cursor/skills/rdc-rest/SKILL.md"><img src="/img/copilot.svg" alt="Github Copilot" style={{
          height: '1em',              // Match font size
          verticalAlign: '-0.125em',  // Fine-tune: try -0.125em or 'middle'
          display: 'inline',          // Inline with text
        }}
/> Skill</Link>
</center>
</p>

import SkillTabs from '@site/src/components/SkillTabs';

<SkillTabs skill="reactive/data-client" />

Install all `rdc-` skills, then generate REST APIs