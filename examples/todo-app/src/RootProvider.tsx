import { CacheProvider, AsyncBoundary } from '@data-client/react';
import { ReactNode } from 'react';

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <CacheProvider {...rest}>
      <AsyncBoundary>{children}</AsyncBoundary>
    </CacheProvider>
  );
}

type ComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? JSX.LibraryManagedAttributes<T, P>
  : never;

type Props = { children: ReactNode } & ComponentProps<typeof CacheProvider>;
