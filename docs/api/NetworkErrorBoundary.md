# \<NetworkErrorBoundary />

Displays a fallback component when a network error happens in its subtree.

```typescript
interface Props {
    children: React.ReactNode;
    fallbackComponent: React.ComponentType<{
        error: NetworkError;
    }>;
}
export default class NetworkErrorBoundary extends React.Component<Props> {
    static defaultProps: {
        fallbackComponent: ({ error }: {
            error: NetworkError;
        }) => JSX.Element;
    };
}
```

Custom fallback usage example:

```typescript
import React from 'react';
import { RestProvider, NetworkErrorBoundary, NetworkError } from 'rest-hooks';

function ErrorPage({ error }: { error: NetworkError }) {
  return (
    <div>
      {error.status} {error.response && error.response.statusText}
    </div>
  )
}

export default function App(): React.ReactElement {
  return (
    <NetworkErrorBoundary fallbackComponent={ErrorPage}>
      <RestProvider>
        <Router />
      </RestProvider>
    </NetworkErrorBoundary>
  );
}
```
