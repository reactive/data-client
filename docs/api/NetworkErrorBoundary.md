# \<NetworkErrorBoundary />

Displays a fallback component when a network error happens in its subtree.

```typescript
interface Props {
    children: React.ReactNode;
    fallbackComponent: React.ComponentType<{
        error: Error;
    }>;
}
export default class NetworkErrorBoundary extends React.Component<Props> {
    static defaultProps: {
        fallbackComponent: ({ error }: {
            error: any;
        }) => JSX.Element;
    };
}
```
