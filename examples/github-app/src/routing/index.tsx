import { createBrowserHistory } from 'history';
import { RouteProvider, RouteController } from '@anansi/router';
import { useController } from 'rest-hooks';

import { routes, namedPaths } from './routes';

const history = createBrowserHistory();

export const router = new RouteController({
  history,
  namedPaths,
  routes,
  notFound: { component: () => <>Not Found</> },
});

export default router;

export function Router({ children }: { children: React.ReactNode }) {
  const controller = useController();
  return (
    <RouteProvider router={router} resolveWith={controller}>
      {children}
    </RouteProvider>
  );
}
