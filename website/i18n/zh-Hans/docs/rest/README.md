---
id: README
title: 在 Reactive Data Client 中使用 REST API
sidebar_label: Usage
description: 使用路径模板和 schema 快速编写 TypeScript REST API。
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import Link from '@docusaurus/Link';

<PkgTabs pkgs="@data-client/rest" />

## 定义 Resource {#define-the-resources}

[Resource](./api/resource.md) 是针对某个 `data model` 的一组 `methods`。[Entity](./api/Entity.md) 和 [schema](./api/schema.md) 是声明式的_数据模型_。
[RestEndpoint](./api/RestEndpoint.md) 则是作用于这些数据的
[_方法_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>)。

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

[Entity](./api/Entity.md) 是一种[拥有主键（pk）](/docs/concepts/normalization)的 schema。正是它让我们
能够[避免状态重复](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state)，这
是实现如此高的安全性和性能的核心设计决策之一。

[static schema](./api/Entity.md#schema) 让我们可以声明式地指定转换，例如对 `createdAt` 进行自动[字段反序列化](./guides/network-transform.md#deserializing-fields)，以及[嵌套 author 字段](./guides/relational-data.md)。

[Url 的构建方式](./api/RestEndpoint.md#url)是将 urlPrefix 与[路径模板](https://github.com/pillarjs/path-to-regexp)组合起来。
TypeScript 会强制要求以冒号前缀指定的参数，例如本例中的 `:slug`。

```ts
// GET http://test.com/article/use-reactive-data-client
ArticleResource.get({ slug: 'use-reactive-data-client' });
```

## 渲染数据 {#render-the-data}

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

[useSuspense()](/docs/api/useSuspense) 的作用类似 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)，确保在返回之前数据已经可用。[了解如何声明你的数据依赖](/docs/getting-started/data-dependency)

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

[useSuspense()](/docs/api/useSuspense) 的作用类似 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)，确保在返回之前数据已经可用。[了解如何声明你的数据依赖](/docs/getting-started/data-dependency)

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

[Server Components](/docs/guides/ssr#server-components) 会让数据变成静态且不可变更的。

:::

</TabItem>
</Tabs>

## 变更数据 {#mutate-the-data}

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

[getList.push](api/resource.md#push) 接收任意 `keyable` 的 body 作为请求载荷发送，然后返回一个 promise，
它会 resolve 为 API 创建的新 Resource。该 Resource 会自动加入缓存，供所有使用方展示。

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

[update](api/resource.md#update) 接收任意 `keyable` 的 body 作为请求载荷发送，然后返回一个 promise，
它接收任意 `keyable` 的 body 作为请求载荷发送，然后返回一个 promise，
它会 resolve 为 API 创建的新 Resource。该 Resource 会自动加入缓存，供所有使用方展示。

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

示例中我们使用了 [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData)，
因为它不需要任何特定的表单状态管理方案。
你可以随意选用自己喜欢的方案。

[变更](/docs/getting-started/mutations)会自动更新_所有_用到该数据的地方，无需
额外的请求。

:::tip[TypeScript 4]

使用 TypeScript（可选）时，需要 4.0 或更高版本。

:::

## REST Agent Skills {#rest-agent-skills}

import SkillTabs from '@site/src/components/SkillTabs';

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

然后调用 `/data-client-rest-setup` 进行迁移

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary button--sm" to="https://skills.sh/reactive/data-client/data-client-rest"><img src="/img/anthropic.svg" alt="REST Codegen Skill" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> REST Codegen Skill</Link>
</div>

### 从 Axios 迁移 {#migrating-from-axios}

`data-client-rest-setup` skill 会自动检测 axios 的使用情况并执行 axios 迁移——包括 [codemod](./guides/axios-migration.md#codemod)、interceptor 转换以及错误处理的迁移。

请参阅完整的 [Axios 迁移指南](./guides/axios-migration.md)，其中包含分步示例、速查表以及独立的 codemod。