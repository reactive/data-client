import { RouteProvider } from '@anansi/router';
import {
  CacheProvider,
  useController,
  AsyncBoundary,ProviderProps
} from '@data-client/react';
import { createBrowserHistory } from 'history';
import type { ReactNode } from 'react';

import { createRouter } from './routing';

const router = createRouter(createBrowserHistory());
function Router({ children }: { children: React.ReactNode }) {
  const controller = useController();

  return (
    <RouteProvider router={router} resolveWith={controller}>
      {children}
    </RouteProvider>
  );
}


type Props = { children: ReactNode } & ProviderProps;

export default function RootProvider({ children, ...rest }: Props) {
  return (
    <CacheProvider {...rest}>
      <Router>
        <AsyncBoundary>{children}</AsyncBoundary>
      </Router>
    </CacheProvider>
  );
}
