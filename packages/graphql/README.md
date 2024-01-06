# Data Client for GraphQL

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/graphql)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/graphql?style=flat-square)](https://bundlephobia.com/result?p=@data-client/graphql)
[![npm version](https://img.shields.io/npm/v/@data-client/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/graphql)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

[GraphQL Endpoints](https://dataclient.io/graphql) for [Data Client](https://dataclient.io)

<div align="center">

**[📖Read The Docs](https://dataclient.io/graphql)** &nbsp;|&nbsp; [🎮Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fresources%2FRepository.tsx)

</div>

### Define GraphQL endpoint

```typescript
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
```

### Simple TypeScript definition

```typescript
class User extends GQLEntity {
  readonly name: string = '';
  readonly email: string = '';
}
```

### Write type-safe queries

```typescript
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

const userDetail = gql.query(
  `query UserDetail($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);
```

### One line data-hookup

```tsx
const { user } = useSuspense(userDetail, { name: 'Fong' });
return (
  <>
    <h2>{user.name}</h2>
    <p>{user.email}</p>
  </>
);
```

### Mutations

```ts
const gql = new GQLEndpoint('https://graphql.org/swapi-graphql');

const createReview = gql.mutation(
  `mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
    createReview(episode: $ep, review: $review) {
      stars
      commentary
    }
  }`,
  { createReview: Review },
);
```

```tsx
const controller = useController();
const createReview = useFetcher(createReview);
return <ReviewForm onSubmit={data => controller.fetch(createReview, data)} />;
```

## API

- Networking definition
  - [Endpoints](https://dataclient.io/rest/api/Endpoint): [GQLEndpoint](https://dataclient.io/graphql/api/GQLEndpoint)
- [Data model](https://dataclient.io/docs/concepts/normalization)
  - [Entity](https://dataclient.io/rest/api/Entity), [schema.Entity](https://dataclient.io/rest/api/schema.Entity) mixin, [GQLEntity](https://dataclient.io/graphql/api/GQLEntity)
  - [Object](https://dataclient.io/rest/api/Object)
  - [Array](https://dataclient.io/rest/api/Array)
  - [Values](https://dataclient.io/rest/api/Values)
  - [All](https://dataclient.io/rest/api/All)
  - [Collection](https://dataclient.io/rest/api/Collection)
  - [Union](https://dataclient.io/rest/api/Union)
  - [Invalidate](https://dataclient.io/rest/api/Invalidate)