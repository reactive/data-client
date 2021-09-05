# Rest Hooks for GraphQL

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/graphql)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/graphql?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/graphql)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/graphql.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/graphql)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

[GraphQL](https://graphql.org/) [Endpoints](https://resthooks.io/docs/getting-started/endpoint) for [Rest Hooks](https://resthooks.io)

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/graphql/usage)**

</div>

### Define GraphQL endpoint

```typescript
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
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

const userDetail = gql.query<{ id: string }>(
  `query UserDetail($id: ID) {
	users(id: $id) {
		id
		name
		email
	}
}`,
  { users: User },
);
```

### One line data-hookup

```tsx
const { users } = useResource(userDetail, { id });
return (
  <>
    <h2>{users.name}</h2>
    <p>{users.email}</p>
  </>
);
```

### Mutations

```ts
const createReview = gql.mutation<{
  ep: string;
  review: { stars: number; commentary: string };
}>(
  `mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}`,
{ createReview: Review }
);
```

```tsx
const createReview = useFetcher(createReview);
return <ReviewForm onSubmit={data => createReview(data)} />;
```
