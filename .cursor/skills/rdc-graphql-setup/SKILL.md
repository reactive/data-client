---
name: rdc-graphql-setup
description: Set up @data-client/graphql for GraphQL APIs. Configures GQLEndpoint with auth and custom options. Use after rdc-setup detects GraphQL patterns.
disable-model-invocation: true
---

# GraphQL Protocol Setup

This skill configures `@data-client/graphql` for a project. It should be applied after `rdc-setup` detects GraphQL patterns.

## Installation

Install the GraphQL package alongside the core package:

```bash
# npm
npm install @data-client/graphql

# yarn
yarn add @data-client/graphql

# pnpm
pnpm add @data-client/graphql
```

## GQLEndpoint Setup

### Basic Configuration

Create a file at `src/api/gql.ts` (or similar):

```ts
import { GQLEndpoint } from '@data-client/graphql';

export const gql = new GQLEndpoint('/graphql');
```

### Detection Checklist

Scan the existing codebase for GraphQL patterns:

1. **GraphQL endpoint URL**: Look for `/graphql` or custom paths
2. **Authentication**: Check for auth headers in existing GraphQL client setup
3. **Custom headers**: API keys, tenant IDs, etc.
4. **Error handling**: GraphQL error parsing patterns

### With Authentication

```ts
import { GQLEndpoint } from '@data-client/graphql';

export const gql = new GQLEndpoint('/graphql', {
  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },
});
```

### Async Authentication (token refresh)

```ts
import { GQLEndpoint } from '@data-client/graphql';

export const gql = new GQLEndpoint('/graphql', {
  async getHeaders() {
    const token = await getValidToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  },
});
```

### Custom Error Handling

```ts
import { GQLEndpoint } from '@data-client/graphql';

class CustomGQLEndpoint extends GQLEndpoint {
  async fetchResponse(input: RequestInfo, init: RequestInit): Promise<any> {
    const response = await super.fetchResponse(input, init);
    
    // Handle GraphQL errors
    if (response.errors?.length) {
      const authError = response.errors.find(
        e => e.extensions?.code === 'UNAUTHENTICATED'
      );
      if (authError) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    
    return response;
  }
}

export const gql = new CustomGQLEndpoint('/graphql');
```

## Defining Queries and Mutations

### Query Example

```ts
import { gql } from './gql';
import { User } from '../schemas/User';

export const getUser = gql.query(
  (v: { id: string }) => `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `,
  { schema: User },
);
```

### Mutation Example

```ts
import { gql } from './gql';
import { User } from '../schemas/User';

export const updateUser = gql.mutation(
  (v: { id: string; name: string }) => `
    mutation UpdateUser($id: ID!, $name: String!) {
      updateUser(id: $id, name: $name) {
        id
        name
      }
    }
  `,
  { schema: User },
);
```

### With Collection

```ts
import { gql } from './gql';
import { User, UserCollection } from '../schemas/User';

export const listUsers = gql.query(
  () => `
    query ListUsers {
      users {
        id
        name
        email
      }
    }
  `,
  { schema: UserCollection },
);

export const createUser = gql.mutation(
  (v: { name: string; email: string }) => `
    mutation CreateUser($name: String!, $email: String!) {
      createUser(name: $name, email: $email) {
        id
        name
        email
      }
    }
  `,
  { schema: UserCollection.push },
);
```

## Usage in Components

```tsx
import { useSuspense, useController } from '@data-client/react';
import { getUser, updateUser } from './api/users';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(getUser, { id });
  const ctrl = useController();

  const handleUpdate = async (name: string) => {
    await ctrl.fetch(updateUser, { id, name });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => handleUpdate('New Name')}>Update</button>
    </div>
  );
}
```

## Next Steps

1. Apply skill "rdc-schema" to define Entity classes
2. Apply skill "rdc-react" for hook usage

## References

- [GQLEndpoint](https://dataclient.io/graphql/api/GQLEndpoint) - Full GQLEndpoint API
- [GraphQL Guide](https://dataclient.io/graphql) - GraphQL usage guide
- [Authentication Guide](references/auth.md) - Auth patterns for GraphQL
