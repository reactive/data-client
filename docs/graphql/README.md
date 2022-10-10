---
id: README
title: GraphQL Usage
sidebar_label: Usage
---
<head>
  <title>GraphQL Usage with Rest Hooks</title>
</head>


import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

<PkgTabs pkgs="@rest-hooks/graphql" />

## Define Endpoint and Schema

```ts title="schema/endpoint.ts"
export const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
export default gql;
```

<LanguageTabs>

```typescript title="schema/User.ts"
import { GQLEntity } from '@rest-hooks/graphql';

export default class User extends GQLEntity {
  readonly name: string | null = null;
  readonly email: string = '';
  readonly age: number = 0;
}
```

```js title="schema/User.ts"
import { GQLEntity } from '@rest-hooks/graphql';

export default class User extends GQLEntity {}
```

</LanguageTabs>

[Entity](api/Entity.md)s are immutable. Use `readonly` in typescript to enforce this.

:::tip

Using GQLEntities is not required, but is important to achieve data consistency.

:::

## Query the Graph

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx title="pages/UserDetail.tsx"
import { useSuspense } from 'rest-hooks';
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
import { useSuspense } from 'rest-hooks';
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

[useSuspense()](/docs/api/useSuspense) guarantees access to data with sufficient [freshness](api/Endpoint.md#dataexpirylength-number).
This means it may issue network calls, and it may [suspend](/docs/getting-started/data-dependency#boundaries) until the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [endpoints](api/Endpoint.md).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

<details><summary><b>SWAPI Demo</b></summary>

<HooksPlayground>

```tsx
const gql = new GQLEndpoint(
  'https://swapi-graphql.netlify.app/.netlify/functions/index',
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
}
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
  const { people, pageInfo } = useSuspense(allPeople, { first: 5 }).allPeople;
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
render(<StarPeople/>);
```

</HooksPlayground>

</details>

## Mutate the Graph

We're using [SWAPI](https://graphql.org/swapi-graphql) as our example, since it offers mutations.

```tsx title="pages/CreateReview.tsx"
import { useController } from 'rest-hooks';
import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint(
  'https://swapi-graphql.netlify.app/.netlify/functions/index',
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
  const { fetch } = useController();
  return (
    <Form onSubmit={e => fetch(createReview, new FormData(e.target))}>
      <FormField name="ep" />
      <FormField name="review" type="compound" />
    </Form>
  );
}
```

The first argument to GQLEndpoint.query or GQLEndpoint.mutate is either the query string
_or_ a function that returns the query string. The main value of using the latter is enforcing
the function argument types.

