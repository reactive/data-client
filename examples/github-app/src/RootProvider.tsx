import {
  DataProvider,
  Controller,
  LogoutManager,
  getDefaultManagers,
  ProviderProps,
} from '@data-client/react';
import { ErrorBoundary } from '@data-client/react';
import type { ReactNode } from 'react';

import { AuthdProvider } from '@/navigation/authdContext';
import { unAuth } from '@/resources/Auth';

import Boundary from './Boundary';
import { Router } from './routing';

const managers = [
  new LogoutManager({
    handleLogout(controller: Controller) {
      unAuth();
      controller.resetEntireStore();
    },
  }),
  ...getDefaultManagers(),
];

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <ErrorBoundary fallbackComponent={ErrorFallback}>
      <DataProvider {...rest} managers={managers}>
        <Router>
          <AuthdProvider>
            <ErrorBoundary fallbackComponent={ErrorFallback}>
              <Boundary>{children}</Boundary>
            </ErrorBoundary>
          </AuthdProvider>
        </Router>
      </DataProvider>
    </ErrorBoundary>
  );
}

type Props = { children: ReactNode } & ProviderProps;

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error?.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
