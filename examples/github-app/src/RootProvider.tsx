import { CacheProvider, Controller, LogoutManager } from '@rest-hooks/react';
import { AuthdProvider } from 'navigation/authdContext';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { unAuth } from 'resources/Auth';

import Boundary from './Boundary';
import { Router } from './routing';

class MyLogoutManager extends LogoutManager {
  handleLogout(controller: Controller) {
    unAuth();
    super.handleLogout(controller);
  }
}
const managers = [
  new MyLogoutManager(),
  ...CacheProvider.defaultProps.managers,
];

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CacheProvider {...rest} managers={managers}>
        <Router>
          <AuthdProvider>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Boundary>{children}</Boundary>
            </ErrorBoundary>
          </AuthdProvider>
        </Router>
      </CacheProvider>
    </ErrorBoundary>
  );
}

type ComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? JSX.LibraryManagedAttributes<T, P>
  : never;

type Props = { children: ReactNode } & ComponentProps<typeof CacheProvider>;

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error?.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
