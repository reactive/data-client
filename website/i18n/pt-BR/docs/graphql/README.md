---
id: README
title: Uso de GraphQL com o Reactive Data Client
sidebar_label: Uso
hide_title: true
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';

<PkgTabs pkgs="@data-client/graphql" />

## Defina o Endpoint e o Schema {#define-endpoint-and-schema}

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

[Entity](api/GQLEntity.md)s são imutáveis. Use `readonly` em TypeScript para garantir isso.

:::tip

Usar GQLEntities não é obrigatório, mas é importante para alcançar consistência dos dados.

:::

## Consulte o grafo {#query-the-graph}

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

[useSuspense()](/docs/api/useSuspense) garante acesso a dados com [atualidade](api/GQLEndpoint.md#dataexpirylength) suficiente.
Isso significa que ele pode fazer chamadas de rede e pode [suspender](/docs/getting-started/data-dependency#boundaries) até que o fetch seja concluído.
Mudanças nos parâmetros resultam no acesso aos dados apropriados, o que também às vezes resulta em novas chamadas de rede e/ou
suspensões.

- Os fetches são controlados de forma centralizada e, portanto, deduplicados automaticamente
- Os dados são centralizados e normalizados, garantindo consistência entre os usos, mesmo com [endpoints](api/GQLEndpoint.md) diferentes.
  - (Por exemplo: navegar de uma lista para uma página de detalhes de um único item mostrará instantaneamente os mesmos dados da lista, sem
    exigir um novo fetch.)

<details>
<summary><b>Demo da SWAPI</b></summary>

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

## Modifique o grafo {#mutate-the-graph}

Estamos usando a [SWAPI](https://graphql.org/swapi-graphql) como exemplo, já que ela oferece mutações.

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

O primeiro argumento de GQLEndpoint.query ou GQLEndpoint.mutate é a string da query
_ou_ uma função que retorna a string da query. O principal valor de usar a segunda opção é impor
os tipos dos argumentos da função.

## Demo combinando com REST {#mixing-with-rest-demo}

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserRepos.tsx,src/resources/Repository.tsx" view="editor" initialpath="/users/ntucker" />
