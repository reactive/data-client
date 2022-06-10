---
title: useCancelling()
---

```typescript
function useCancelling<E extends EndpointInterface & {
    extend: (o: {
        signal?: AbortSignal | undefined;
    }) => any;
}>(endpoint: E, params: EndpointParam<E> | null): E
```

Builds an Endpoint that cancels fetch everytime params change

[Aborts](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) inflight request if the parameters change.

```tsx
import { useCancelling } from '@rest-hooks/hooks';
import { useSuspense } from 'rest-hooks';

const CancelingUserList = useCancelling(UserList, { query });
const users = useSuspense(CancelingUserList, { query });
```

Part of [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks)
