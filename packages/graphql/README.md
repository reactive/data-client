# Rest Hooks for GraphQL

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/graphql)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/graphql?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/graphql)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/graphql)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

[GraphQL Endpoints](https://resthooks.io/graphql) for [Rest Hooks](https://resthooks.io)

<div align="center">

**[📖Read The Docs](https://resthooks.io/graphql)** &nbsp;|&nbsp; [🎮Github Demo](https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?file=src%2Fresources%2FRepository.tsx)

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
