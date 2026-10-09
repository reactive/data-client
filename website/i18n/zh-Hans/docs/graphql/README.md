---
id: README
title: 在 Reactive Data Client 中使用 GraphQL
sidebar_label: 用法
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';

<PkgTabs pkgs="@data-client/graphql" />

## 定义 Endpoint 与 Schema {#define-endpoint-and-schema}

```ts title="schema/endpoint.ts"
export const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
export default gql;
```

<LanguageTabs>

```typescript title="schema/User.ts"
import { GQLEntity } from '@data-client/graphql';

export default class User extends GQLEntity {
  name: string | null = null;
  email = '';
  age = 0;
}
```

```js title="schema/User.ts"
import { GQLEntity } from '@data-client/graphql';

export default class User extends GQLEntity {}
```

</LanguageTabs>

[Entity](api/GQLEntity.md) 是不可变的。在 TypeScript 中使用 `readonly` 来强制这一点。

:::tip

使用 GQLEntity 并非必需，但对实现数据一致性很重要。

:::

## 查询图 {#query-the-graph}

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx title="pages/UserDetail.tsx"
import { useSuspense } from '@data-client/react';
import User from 'schema/User';
import gql from 'schema/endpoint';

export const userDetail = gql.query(
  (v: { name: string }) => `query UserDetail($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);

export default function UserDetail({ name }: { name: string }) {
  const { user } = useSuspense(userDetail, { name });
  return (
    <article>
      <h2>{user.name}</h2>
      <div>{user.email}</div>
    </article>
  );
}
```

</TabItem>
<TabItem value="List">

```tsx title="pages/UserList.tsx"
import { useSuspense } from '@data-client/react';
import User from 'schema/User';
import gql from 'schema/endpoint';

const userList = gql.query(
  `{
    users {
      id
      name
      email
      }
    }`,
  { users: [User] },
);

export default function UserList() {
  const { users } = useSuspense(userList, {});
  return (
    <section>
      {users.map(user => (
        <UserSummary key={user.pk()} user={user} />
      ))}
    </section>
  );
}
```

</TabItem>
</Tabs>

[useSuspense()](/docs/api/useSuspense) 保证访问到足够[新鲜](api/GQLEndpoint.md#dataexpirylength)的数据。
这意味着它可能会发起网络请求，并可能[挂起](/docs/getting-started/data-dependency#boundaries)直到获取完成。
参数变化会使其访问相应的数据，这有时也会引发新的网络请求和/或
挂起。

- 请求由中心统一控制，因此会自动去重
- 数据集中存放并经过规范化，即使使用不同的 [endpoint](api/GQLEndpoint.md)，也能保证各处使用的一致性。
  - （例如：从列表视图进入某一条目的详情页时，会立即显示与列表相同的数据，而无需
    重新获取。）

<details>
<summary><b>SWAPI 演示</b></summary>

<HooksPlayground>

```tsx
import { useSuspense } from '@data-client/react';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';

const gql = new GQLEndpoint(
  'https://swapi-graphql.netlify.app/graphql',
);
class Person extends GQLEntity {
  readonly id: string = '';
  readonly name: string = '';
  readonly height: string = '';
}
const PageInfo = {
  hasNextPage: false,
  startCursor: '',
  endCursor: '',
};
const allPeople = gql.query(
  (v: { first?: number; after?: string }) => `
query People($first: Int, $after:String) {
  allPeople(first: $first, after:$after) {
    people{
      id,name,height
    },
    pageInfo {
      hasNextPage,
      startCursor,
      endCursor
    }
  }
}
`,
  { allPeople: { people: [Person], pageInfo: PageInfo } },
);
function StarPeople() {
  const { people, pageInfo } = useSuspense(allPeople, {
    first: 5,
  }).allPeople;
  return (
    <div>
      {people.map(person => (
        <div key={person.id}>
          name: {person.name} height: {person.height}
        </div>
      ))}
    </div>
  );
}
render(<StarPeople />);
```

</HooksPlayground>

</details>

## 变更图 {#mutate-the-graph}

我们使用 [SWAPI](https://graphql.org/swapi-graphql) 作为示例，因为它提供了变更操作。

```tsx title="pages/CreateReview.tsx"
import { useController } from '@data-client/react';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';

const gql = new GQLEndpoint(
  'https://swapi-graphql.netlify.app/graphql',
);

class Review extends GQLEntity {
  readonly stars: number = 0;
  readonly commentary: string = '';
}

const createReview = gql.mutation(
  (v: {
    ep: string;
    review: { stars: number; commentary: string };
  }) => `mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
    createReview(episode: $ep, review: $review) {
      stars
      commentary
    }
  }`,
  { createReview: Review },
);

export default function NewReviewForm() {
  const ctrl = useController();
  return (
    <Form onSubmit={variables => ctrl.fetch(createReview, variables)}>
      <FormField name="ep" />
      <FormField name="review" type="compound" />
    </Form>
  );
}
```

GQLEndpoint.query 或 GQLEndpoint.mutate 的第一个参数可以是查询字符串，
_也可以_是返回查询字符串的函数。使用后者的主要价值在于可以约束
函数参数的类型。

## 与 REST 混用的演示 {#mixing-with-rest-demo}

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserRepos.tsx,src/resources/Repository.tsx" view="editor" initialpath="/users/ntucker" />
