import {
  CacheProvider,
  AsyncBoundary,
  ProviderProps,
} from '@data-client/react';

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <CacheProvider {...rest}>
      <AsyncBoundary>{children}</AsyncBoundary>
    </CacheProvider>
  );
}

type Props = { children: React.ReactNode } & ProviderProps;
