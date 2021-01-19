---
title: useCancelling()
id: version-5.0.0-useCancelling
original_id: useCancelling
---

```typescript
function useCancelling<E extends EndpointInterface & {
    extend: (o: {
        signal?: AbortSignal | undefined;
    }) => any;
}>(endpoint: E, params: EndpointParam<E> | null): E
```

Builds an Endpoint that cancels fetch everytime params change

```tsx
import { useCancelling } from '@rest-hooks/hooks';
import { useResource } from 'rest-hooks';

const CancelingUserList = useCancelling(UserList, { query });
const users = useResource(CancelingUserList, { query });
```
