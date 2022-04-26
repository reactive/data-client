---
title: useResetter()
---

:::tip

Use [Controller.resetEntireStore()](./Controller.md#resetEntireStore) instead

:::

```typescript
function useResetter(): () => void;
```

Mostly useful for imperatively resetting the cache.

Does not accept any arguments will always reset when called.

This is more than just expiring the items.  Useful when so much has changed
e.g. impersonating a user that the entire cache set must be thrown away and
retrieved again.

## Example

```typescript
import { Resource } from '@rest-hooks/rest';

// Server returns the logged in user
export default class CurrentUserResource extends Resource {
  readonly id: string = null;
  readonly name: string = '';
  // ...
}
```

```tsx
const USER_NUMBER_ONE: string = "1111";

function UserName() {
  const user = useSuspense(CurrentUserResource.detail(), { });
  const resetCache = useResetter();

  const becomeAdmin = useCallback(() => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // Empty the cache
    resetCache();
  }, []);
  return (
    <div>
      <h1>{user.name}<h1>
      <button onClick={becomeAdmin}>Be Number One</button>
    </div>
  );
}
```
