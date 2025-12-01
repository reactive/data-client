import {
  Controller,
  LogoutManager,
  getDefaultManagers,
  type Manager,
} from '@data-client/react';
import { ErrorBoundary } from '@data-client/react';
import type { ReactNode } from 'react';

import Boundary from '@/Boundary';
import { AuthdProvider } from '@/navigation/authdContext';
import { unAuth } from '@/resources/Auth';

export const getManagers: () => Manager[] = () => {
  return [
    new LogoutManager({
      handleLogout(controller: Controller) {
        unAuth();
        controller.resetEntireStore();
      },
    }),
    ...getDefaultManagers(),
  ];
};

export default function RootProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallbackComponent={ErrorFallback}>
      <AuthdProvider>
        <ErrorBoundary fallbackComponent={ErrorFallback}>
          <Boundary>{children}</Boundary>
        </ErrorBoundary>
      </AuthdProvider>
    </ErrorBoundary>
  );
}

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
