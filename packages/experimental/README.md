# Experimental extensions for Rest Hooks

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/experimental.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/experimental)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/experimental?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/experimental)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/experimental.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/experimental)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

<div align="center">

**[📖Read The Docs](https://resthooks.io)**

</div>

## Motivation

Field application of designs help smooth edges of a theoretical design. New designs can be iterated on here, breaking freely without worry of legacy support plans.

## Usage

### useFetcher()

```tsx
const fetch = useFetcher();

return (
  <form onSubmit={() => fetch(User.create(), userPayload)}>
    <button onClick={() => fetch(User.list())}>Refresh list</button>
  </form>
);
```

### Endpoint.update

<details open><summary><b>Simple</b></summary>

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string) => ({
    [userList.key({})]: (users = []) => [newUserId, ...users],
  }),
});
```

</details>

<details><summary><b>Multiple updates</b></summary>

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string)  => {
    const updates = {
      [userList.key()]: (users = []) => [newUserId, ...users],
      [userList.key({ sortBy: 'createdAt' })]: (users = [], { sortBy }) => {
        const ret = [newUserId, ...users];
        ret.sortBy(sortBy);
        return ret;
      },
    ];
    if (newUser.isAdmin) {
      updates[userList.key({ admin: true })] = (users = []) => [newUserId, ...users];
    }
    return updates;
  },
});
```

</details>


### Entity, EntityRecord, Resource, BaseResource

- Normalizes to pojo
- Faster
- Entity has no defined key lookups - but EntityRecord does.
- BaseResource is missing predefined endpoints (list, detail, etc), but has everything else
