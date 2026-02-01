---
name: rdc-endpoint-setup
description: Set up @data-client/endpoint for custom async operations. Wraps existing async functions with Endpoint for use with Data Client hooks. Use after rdc-setup detects non-REST/GraphQL async patterns.
disable-model-invocation: true
---

# Custom Endpoint Setup

This skill configures `@data-client/endpoint` for wrapping existing async functions. It should be applied after `rdc-setup` detects custom async patterns that aren't REST or GraphQL.

## Installation

Install the endpoint package alongside the core package:

```bash
# npm
npm install @data-client/endpoint

# yarn
yarn add @data-client/endpoint

# pnpm
pnpm add @data-client/endpoint
```

## When to Use

Use `@data-client/endpoint` when:
- Working with third-party SDK clients (Firebase, Supabase, AWS SDK, etc.)
- Using WebSocket connections for data fetching
- Accessing local async storage (IndexedDB, AsyncStorage)
- Any async function that doesn't fit REST or GraphQL patterns

## Wrapping Async Functions

See [Endpoint](references/Endpoint.md) for full API documentation.

### Detection

Scan for existing async functions that fetch data:
- Functions returning `Promise<T>`
- SDK client methods
- WebSocket message handlers
- IndexedDB operations

### Basic Wrapping Pattern

**Before (existing code):**
```ts
// src/api/users.ts
export async function getUser(id: string): Promise<User> {
  const response = await sdk.users.get(id);
  return response.data;
}

export async function listUsers(filters: UserFilters): Promise<User[]> {
  const response = await sdk.users.list(filters);
  return response.data;
}
```

**After (with Endpoint wrapper):**
```ts
// src/api/users.ts
import { Endpoint } from '@data-client/endpoint';
import { User } from '../schemas/User';

// Original functions (keep for reference or direct use)
async function fetchUser(id: string): Promise<User> {
  const response = await sdk.users.get(id);
  return response.data;
}

async function fetchUsers(filters: UserFilters): Promise<User[]> {
  const response = await sdk.users.list(filters);
  return response.data;
}

// Wrapped as Endpoints for use with Data Client hooks
export const getUser = new Endpoint(fetchUser, {
  schema: User,
  name: 'getUser',
});

export const listUsers = new Endpoint(fetchUsers, {
  schema: [User],
  name: 'listUsers',
});
```

## Endpoint Options

Configure based on the function's behavior:

```ts
export const getUser = new Endpoint(fetchUser, {
  // Required for normalization
  schema: User,
  
  // Unique name (important if function names get mangled in production)
  name: 'getUser',
  
  // Mark as side-effect if it modifies data
  sideEffect: true, // for mutations
  
  // Cache configuration
  dataExpiryLength: 60000, // 1 minute
  errorExpiryLength: 5000, // 5 seconds
  
  // Enable polling
  pollFrequency: 30000, // poll every 30 seconds
  
  // Optimistic updates
  getOptimisticResponse(snap, id) {
    return snap.get(User, { id });
  },
});
```

## Custom Key Function

If the default key function doesn't work for your use case:

```ts
export const searchUsers = new Endpoint(fetchSearchUsers, {
  schema: [User],
  name: 'searchUsers',
  key({ query, page }) {
    // Custom key for complex parameters
    return `searchUsers:${query}:${page}`;
  },
});
```

## Common Patterns

### Firebase/Firestore

```ts
import { Endpoint } from '@data-client/endpoint';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../schemas/User';

async function fetchUser(id: string): Promise<User> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  return { id: docSnap.id, ...docSnap.data() } as User;
}

async function fetchUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
}

export const getUser = new Endpoint(fetchUser, {
  schema: User,
  name: 'getUser',
});

export const listUsers = new Endpoint(fetchUsers, {
  schema: [User],
  name: 'listUsers',
});
```

### Supabase

```ts
import { Endpoint } from '@data-client/endpoint';
import { supabase } from './supabase';
import { User } from '../schemas/User';

async function fetchUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchUsers(filters?: { role?: string }): Promise<User[]> {
  let query = supabase.from('users').select('*');
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const getUser = new Endpoint(fetchUser, {
  schema: User,
  name: 'getUser',
});

export const listUsers = new Endpoint(fetchUsers, {
  schema: [User],
  name: 'listUsers',
});
```

### IndexedDB

```ts
import { Endpoint } from '@data-client/endpoint';
import { User } from '../schemas/User';

async function fetchUserFromCache(id: string): Promise<User | undefined> {
  const db = await openDB('myapp', 1);
  return db.get('users', id);
}

async function fetchUsersFromCache(): Promise<User[]> {
  const db = await openDB('myapp', 1);
  return db.getAll('users');
}

export const getCachedUser = new Endpoint(fetchUserFromCache, {
  schema: User,
  name: 'getCachedUser',
  dataExpiryLength: Infinity, // Never expires
});

export const listCachedUsers = new Endpoint(fetchUsersFromCache, {
  schema: [User],
  name: 'listCachedUsers',
  dataExpiryLength: Infinity,
});
```

### WebSocket Fetch

```ts
import { Endpoint } from '@data-client/endpoint';
import { socket } from './socket';
import { Message } from '../schemas/Message';

async function fetchMessages(roomId: string): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    socket.emit('getMessages', { roomId }, (response: any) => {
      if (response.error) reject(response.error);
      else resolve(response.data);
    });
  });
}

export const getMessages = new Endpoint(fetchMessages, {
  schema: [Message],
  name: 'getMessages',
});
```

## Mutations with Side Effects

```ts
export const createUser = new Endpoint(
  async (userData: Omit<User, 'id'>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  {
    schema: User,
    name: 'createUser',
    sideEffect: true,
  },
);

export const deleteUser = new Endpoint(
  async (id: string): Promise<{ id: string }> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
  {
    name: 'deleteUser',
    sideEffect: true,
  },
);
```

## Using extend() for Variations

```ts
const baseUserEndpoint = new Endpoint(fetchUser, {
  schema: User,
  name: 'getUser',
});

// With different cache settings
export const getUserFresh = baseUserEndpoint.extend({
  dataExpiryLength: 0, // Always refetch
});

// With polling
export const getUserLive = baseUserEndpoint.extend({
  pollFrequency: 5000, // Poll every 5 seconds
});
```

## Important: Function Name Mangling

In production builds, function names may be mangled. **Always provide explicit `name` option**:

```ts
// Bad - name may become 'a' or similar in production
const getUser = new Endpoint(fetchUser);

// Good - explicit name survives minification
const getUser = new Endpoint(fetchUser, { name: 'getUser' });
```

## Usage in Components

```tsx
import { useSuspense, useController } from '@data-client/react';
import { getUser, createUser } from './api/users';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(getUser, id);
  const ctrl = useController();

  const handleCreate = async (userData: UserData) => {
    await ctrl.fetch(createUser, userData);
  };

  return <div>{user.name}</div>;
}
```

## Next Steps

1. Apply skill "rdc-schema" to define Entity classes
2. Apply skill "rdc-react" for hook usage

## References

- [Endpoint](references/Endpoint.md) - Full Endpoint API
