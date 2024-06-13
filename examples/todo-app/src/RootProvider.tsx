import {
  DataProvider,
  AsyncBoundary,
  ProviderProps,
} from '@data-client/react';

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <DataProvider {...rest}>
      <AsyncBoundary>{children}</AsyncBoundary>
    </DataProvider>
  );
}

type Props = { children: React.ReactNode } & ProviderProps;
