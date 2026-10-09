---
id: README
title: Uso de GraphQL con Reactive Data Client
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

## Define el Endpoint y el Schema {#define-endpoint-and-schema}

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

Las [Entity](api/GQLEntity.md) son inmutables. Usa `readonly` en TypeScript para imponerlo.

:::tip

Usar GQLEntities no es obligatorio, pero es importante para lograr la consistencia de los datos.

:::

## Consulta el grafo {#query-the-graph}

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

[useSuspense()](/docs/api/useSuspense) garantiza el acceso a datos con la [frescura](api/GQLEndpoint.md#dataexpirylength) suficiente.
Esto significa que puede realizar llamadas de red y que puede [suspender](/docs/getting-started/data-dependency#boundaries) hasta que el fetch se complete.
Los cambios de parámetros darán acceso a los datos adecuados, lo que a veces también provoca nuevas llamadas de red y/o
suspensiones.

- Los fetches se controlan de forma centralizada y, por tanto, se deduplican automáticamente
- Los datos están centralizados y normalizados, lo que garantiza la consistencia entre usos, incluso con distintos [endpoints](api/GQLEndpoint.md).
  - (Por ejemplo: navegar a una página de detalle de un solo elemento desde una vista de lista mostrará al instante los mismos datos que la lista sin
    necesidad de volver a hacer el fetch.)

<details>
<summary><b>Demo de SWAPI</b></summary>

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

## Muta el grafo {#mutate-the-graph}

Usamos [SWAPI](https://graphql.org/swapi-graphql) como ejemplo, ya que ofrece mutaciones.

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

El primer argumento de GQLEndpoint.query o GQLEndpoint.mutate es la cadena de la consulta
_o_ una función que devuelve la cadena de la consulta. La principal ventaja de usar la segunda opción es imponer
los tipos de los argumentos de la función.

## Demo de combinación con REST {#mixing-with-rest-demo}

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserRepos.tsx,src/resources/Repository.tsx" view="editor" initialpath="/users/ntucker" />
