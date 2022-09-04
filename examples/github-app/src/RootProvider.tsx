import { CacheProvider } from 'rest-hooks';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AuthdProvider } from 'navigation/authdContext';

import { Router } from './routing';
import Boundary from './Boundary';

type ComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? JSX.LibraryManagedAttributes<T, P>
  : never;

type Props = { children: ReactNode } & ComponentProps<typeof CacheProvider>;

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CacheProvider {...rest}>
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
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error?.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
